import {Injectable} from "@angular/core";
import {debounceTime} from "rxjs/operators";
import {LOG, LoggerContext} from "ngx-wcore";
import {CastorSyncService} from "./castor-sync.service";
import {WorkerService} from "./worker.service";
import {
  ApiStratigraphie,
  ApiUs,
  StratigraphieClient,
  ValidationError as WorkerValidationError,
  ValidationErrorReason,
  ValidationResult as WorkerValidationResult
} from "../../../shared";
import {dbBoundObject} from "../DataClasses/models/db-bound-object";

/**
 * Un couple (US, Fait) + direction pour identifier un point du graphe.
 */
type linkedFaitUsUuid = {
  us: string,
  fait:string,
  direction: StratDirection,
  stratigraphie_uuid: string
}
function areEqualNotNull(values): boolean {
  if (values[0] === null) return false;
  return values.every(value => value === values[0]);
}
enum StratDirection {
  past = 'past',
  future = 'future'
}
type linkedFaitUsUuidHistory = {
  us: Set<string>,
  fait: Set<string>,
}
interface StratigraphieDescriptor {
  uuid:  linkedFaitUsUuid;
  strati_uuid: string;
  anterieur: Set<StratigraphieDescriptor>;
  contemporain: Set<StratigraphieDescriptor>;
  posterieur: Set<StratigraphieDescriptor>;
}
const CONTEXT: LoggerContext = {
  origin: 'CastorValidationService'
}
interface GraphValidationError {
  graph: StratigraphieDescriptor,
  stratigraphie: ApiStratigraphie,
  error: Error
}

export interface ValidationResult {
  result: boolean;
  message?: string;
  paradoxType?: 'containment' | 'consistency' | 'temporal' | 'cycle' | string;
  cycleInfo?: {
    cycleId: string;
    cycleNodes: string[];
    cycleNodesUUIDs?: string[];
  };
  conflictingRelations?: ApiStratigraphie[];
  shortMessage?: string;
}

export interface DetectedParadox {
  type: 'containment' | 'consistency' | 'temporal' | 'cycle' | string;
  message: string;
  relations: ApiStratigraphie[];
  relatedRelations?: ApiStratigraphie[]; // Relations liées au paradoxe
  debugInfo?: any;
  shortMessage?: string;
}

export interface CycleParadox extends DetectedParadox {
  cycleId: string;
  cycleNodes: string[];
  allRelations: ApiStratigraphie[];
  cycleNodesUUIDs?: string[];
}

interface ExplorationContext {
  depth: number;
  nodesExplored: number;
  startTime: number;
  maxDepth: number;
  maxNodes: number;
  timeout: number;
}

const WORKER_REASON_MESSAGES: Record<ValidationErrorReason, string> = {
  SELF_TARGETING: 'PARADOX detected : CONDITION SELF TARGETING',
  CYCLE_DETECTED: 'PARADOX detected : CYCLE DETECTED',
  PRESENT_CONFLICT: 'PARADOX detected : CONDITION PRESENT CONFLICT',
  INVALID_ENDPOINT: 'PARADOX detected : INVALID ENDPOINT'
};

@Injectable({
  providedIn: 'root'
})


export class CastorValidationService {

  /**
   * Cache mémoire des validations pour éviter de recalculer la même stratigraphie plusieurs fois.
   */
  private validationCache = new Map<string, ValidationResult>();
  /**
   * Index des relations actives par uuid (stratigraphie_uuid) afin de retrouver rapidement un enregistrement.
   */
  private relationsByUuid = new Map<string, ApiStratigraphie>();
  /**
   * Index inversé (clé = type + uuid) vers les relations qui mentionnent cette US ou ce Fait.
   */
  private relationsByNode = new Map<string, Set<ApiStratigraphie>>();
  /**
   * Liste des relations actives (live = true) pour itérer rapidement sans re-filtrer le worker à chaque appel.
   */
  private liveRelations: ApiStratigraphie[] = [];
  /**
   * Caches pour accélérer les accès aux entités (us/fait) lors des validations répétées.
   */
  private usTagCache = new Map<string, string>();
  private faitTagCache = new Map<string, string>();
  private usToFaitCache = new Map<string, string | null>();
  private faitToUsCache = new Map<string, string[]>();
  private knownUs = new Set<string>();
  private knownFaits = new Set<string>();
  /**
   * Flag pour éviter de reconstruire la cartographie sans besoin.
   */
  private cacheReady = false;
  /**
   * Carte des promesses de validation en cours (par UUID) pour éviter les recalculs concurrents.
   */
  private validationPromises = new Map<string, Promise<ValidationResult>>();

  private readonly workerSupported = typeof Worker !== 'undefined';
  private workerClient: StratigraphieClient | null = null;
  private workerReady = false;
  private workerGraphPromise: Promise<void> | null = null;
  private workerGraphVersion = 0;
  private workerFailureLogged = false;

  /**
   * Singleton pour éviter plusieurs validations de liste en parallèle
   */
  private batchValidationRunning = false;
  private batchValidationAbortController: AbortController | null = null;

  constructor(private w: WorkerService, private syncService: CastorSyncService) {
    // On se branche directement sur les changements de stratigraphie pour tenir le cache à jour.
    this.w.data().objects.stratigraphie.all.onValueChange().subscribe(() => {
      this.rebuildCache();
    });

    // Synchroniser le cache du worker après chaque sync réussi
    this.syncService.dataSynced$.pipe(
      debounceTime(500)
    ).subscribe(() => {
      LOG.debug.log({...CONTEXT, action: 'dataSynced', message: 'Rebuilding validation cache after sync'});
      this.rebuildCache();
    });

    // Première initialisation (utile au démarrage ou pour les tests unitaires).
    this.rebuildCache();
  }

  /**
   * Vérifie si une validation de batch est en cours
   */
  isBatchValidationRunning(): boolean {
    return this.batchValidationRunning;
  }

  /**
   * Annule la validation de batch en cours
   */
  cancelBatchValidation(): void {
    if (this.batchValidationAbortController) {
      this.batchValidationAbortController.abort();
      this.batchValidationAbortController = null;
    }
    this.batchValidationRunning = false;
  }

  /**
   * Valide une liste de stratigraphies de manière contrôlée (singleton, annulable)
   */
  async validateBatch(
    stratigraphies: ApiStratigraphie[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, ValidationResult>> {
    // Singleton : une seule validation de batch à la fois
    if (this.batchValidationRunning) {
      throw new Error('Une validation de batch est déjà en cours. Annulez-la d\'abord.');
    }

    this.batchValidationRunning = true;
    this.batchValidationAbortController = new AbortController();
    const results = new Map<string, ValidationResult>();

    try {
      const BATCH_SIZE = 5; // Réduit à 5 pour moins de charge

      for (let i = 0; i < stratigraphies.length; i += BATCH_SIZE) {
        // Vérifier si annulé
        if (this.batchValidationAbortController.signal.aborted) {
          LOG.info.log({...CONTEXT, action: 'validateBatch', message: 'Validation annulée'});
          break;
        }

        const batch = stratigraphies.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (strati) => {
          try {
            const result = await this.validateStratigraphie(strati);
            return { uuid: strati.stratigraphie_uuid, result };
          } catch (error) {
            LOG.warn.log({...CONTEXT, action: 'validateBatch', message: 'Erreur sur item'}, error);
            return {
              uuid: strati.stratigraphie_uuid,
              result: { result: false, message: 'Validation error: ' + error?.message }
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(({ uuid, result }) => {
          if (uuid) {
            results.set(uuid, result);
          }
        });

        // Callback de progression
        if (onProgress) {
          onProgress(Math.min(i + BATCH_SIZE, stratigraphies.length), stratigraphies.length);
        }

        // Petite pause entre les batches pour laisser respirer le navigateur
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      return results;
    } finally {
      this.batchValidationRunning = false;
      this.batchValidationAbortController = null;
    }
  }

  private async validateWithPreferredEngine(stratigraphie: ApiStratigraphie): Promise<ValidationResult> {
    if (this.workerSupported) {
      try {
        return await this.validateWithWorker(stratigraphie);
      } catch (error) {
        if (!this.workerFailureLogged) {
          LOG.warn.log(
            {...CONTEXT, action: 'validateStratigraphie', message: 'Worker validation failed, fallback to legacy'},
            error
          );
          this.workerFailureLogged = true;
        }
      }
    }
    return this.legacyValidateStratigraphie(stratigraphie);
  }

  private async validateWithWorker(stratigraphie: ApiStratigraphie): Promise<ValidationResult> {
    await this.ensureWorkerGraphSynced();
    if (!this.workerClient) {
      throw new Error('Stratigraphie validation worker unavailable');
    }

    // Timeout de 10 secondes pour la validation worker
    const workerPromise = this.workerClient.validateRelation(stratigraphie);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Worker validation timeout after 10s')), 10000)
    );

    const workerResult = await Promise.race([workerPromise, timeoutPromise]);
    return this.normalizeWorkerResult(workerResult);
  }

  private normalizeWorkerResult(result: WorkerValidationResult): ValidationResult {
    if (result.ok) {
      return {result: true};
    }
    const reason = (result as WorkerValidationError).reason;
    const message = WORKER_REASON_MESSAGES[reason] ?? `PARADOX detected : ${reason}`;
    return {result: false, message};
  }

  private getExplorationLimits(): { maxDepth: number, maxNodes: number, timeout: number } {
    const relationCount = this.liveRelations.length;

    if (relationCount < 50) {
      return {
        maxDepth: 50,
        maxNodes: 200,
        timeout: 3000
      };
    } else if (relationCount < 200) {
      return {
        maxDepth: 100,
        maxNodes: 500,
        timeout: 5000
      };
    } else {
      return {
        maxDepth: 200,
        maxNodes: 1000,
        timeout: 10000
      };
    }
  }

  private legacyValidateStratigraphie(stratigraphie: ApiStratigraphie): ValidationResult {
    try {
      const initial_uuid: linkedFaitUsUuid = {
        us: stratigraphie.us_posterieur,
        fait: stratigraphie.fait_posterieur,
        direction: StratDirection.future,
        stratigraphie_uuid: stratigraphie.stratigraphie_uuid
      };

      const target_uuid: linkedFaitUsUuid = {
        fait: stratigraphie.fait_anterieur,
        us: stratigraphie.us_anterieur,
        direction: StratDirection.past,
        stratigraphie_uuid: stratigraphie.stratigraphie_uuid
      };

      const history: linkedFaitUsUuidHistory = {
        us: new Set<string>([initial_uuid.us].filter(i => i)),
        fait: new Set<string>([initial_uuid.fait].filter(i => i)),
      };

      const graph: StratigraphieDescriptor = {
        uuid: initial_uuid,
        strati_uuid: stratigraphie.stratigraphie_uuid,
        anterieur: new Set<StratigraphieDescriptor>([]),
        contemporain: new Set<StratigraphieDescriptor>([]),
        posterieur: new Set<StratigraphieDescriptor>([])
      };

      const limits = this.getExplorationLimits();
      const explorationContext = {
        depth: 0,
        nodesExplored: 0,
        startTime: Date.now(),
        maxDepth: limits.maxDepth,
        maxNodes: limits.maxNodes,
        timeout: limits.timeout
      };

      if (stratigraphie.is_contemporain) {
        if (target_uuid && graph.uuid !== target_uuid
          && !this.checkPast(graph, target_uuid)
          && !this.checkFuture(graph, target_uuid)) {
          if (!this.checkPresent(graph, graph.uuid)) {
            graph.contemporain.add(
              this.exploreStratiLevel(graph, target_uuid, history, true, explorationContext)
            );
          } else {
            throw ({graph, error: new Error('PARADOX detected : CONDITION Y'), stratigraphie, target_uuid});
          }
        } else {
          throw ({graph, error: new Error('PARADOX detected : CONDITION X'), stratigraphie, target_uuid});
        }
      } else {
        if (
          areEqualNotNull([target_uuid.us, graph.uuid.us])
          ||
          areEqualNotNull([target_uuid.fait, graph.uuid.fait])
        ) {
          throw ({graph, stratigraphie, error: new Error('PARADOX detected : CONDITION SELF TARGETING'), target_uuid});
        }

        if (target_uuid.direction === StratDirection.past) {
          if (target_uuid && graph.uuid !== target_uuid && !this.checkPast(graph, target_uuid) && !this.checkPresent(graph, target_uuid)) {
            graph.anterieur.add(
              this.exploreStratiLevel(graph, target_uuid, history, false, explorationContext)
            );
          } else {
            throw ({graph, error: new Error('PARADOX detected : CONDITION 1'), stratigraphie, target_uuid});
          }
        } else if (target_uuid.direction === StratDirection.future) {
          if (target_uuid && graph.uuid !== target_uuid && !this.checkFuture(graph, target_uuid) && !this.checkPresent(graph, target_uuid)) {
            graph.posterieur.add(
              this.exploreStratiLevel(graph, target_uuid, history, false, explorationContext)
            );
          } else {
            throw ({graph, error: new Error('PARADOX detected : CONDITION 2'), target_uuid});
          }
        } else {
          throw ({graph, stratigraphie, error: new Error('YOU LOST ?'), target_uuid});
        }
      }

      if (stratigraphie.is_contemporain) {
        if (this.checkFuture(graph, initial_uuid) || this.checkPast(graph, initial_uuid)) {
          throw ({graph, error: new Error('PARADOX detected : found object in different timeline, should be in present'), stratigraphie, target_uuid});
        }
      } else if (target_uuid.direction === StratDirection.past) {
        if (this.checkPast(graph, initial_uuid) || this.checkPresent(graph, initial_uuid)) {
          throw ({graph, error: new Error('PARADOX detected : found object in different timeline, expected in past'), stratigraphie, target_uuid});
        }
      } else if (target_uuid.direction === StratDirection.future) {
        if (this.checkFuture(graph, initial_uuid) || this.checkPresent(graph, initial_uuid)) {
          throw ({graph, error: new Error('PARADOX detected : found object in different timeline, expected in future'), stratigraphie, target_uuid});
        }
      } else {
        throw ({graph, stratigraphie, error: new Error('YOU LOST(2) ?'), target_uuid});
      }

      return {result: true};
    } catch (e: unknown) {
      const validationError = (e as GraphValidationError);
      LOG.error.log({...CONTEXT, action: 'validateStratigraphie', message: validationError?.error?.message}, validationError);
      return {result: false, message: validationError.error?.message};
    }
  }

  private async ensureWorkerGraphSynced(): Promise<void> {
    if (!this.workerSupported) {
      throw new Error('Web worker non supporté');
    }
    if (!this.workerGraphPromise) {
      this.scheduleWorkerGraphSync();
    }
    await this.workerGraphPromise;
  }

  private scheduleWorkerGraphSync(): void {
    if (!this.workerSupported) {
      return;
    }
    const version = ++this.workerGraphVersion;
    this.workerGraphPromise = (async () => {
      await this.ensureWorkerInstance();
      if (!this.workerClient) {
        throw new Error('Stratigraphie worker creation failed');
      }
      const nodes = this.collectGraphNodes(this.liveRelations);
      await this.workerClient.init(nodes, this.liveRelations);
      if (version === this.workerGraphVersion) {
        this.workerReady = true;
      }
      this.workerGraphPromise = null;
    })().catch(error => {
      if (version === this.workerGraphVersion) {
        this.workerReady = false;
      }
      this.workerGraphPromise = null;
      throw error;
    });
  }

  private async ensureWorkerInstance(): Promise<void> {
    if (!this.workerSupported) {
      throw new Error('Web worker non supporté');
    }
    if (!this.workerClient) {
      const worker = new Worker(new URL('./workers/strati-validation.worker', import.meta.url), {type: 'module'});
      this.workerClient = new StratigraphieClient(worker);
    }
  }

  private collectGraphNodes(relations: ApiStratigraphie[]): string[] {
    const nodes = new Set<string>();
    relations.forEach(rel => {
      [
        rel.us_anterieur,
        rel.us_posterieur,
        rel.fait_anterieur,
        rel.fait_posterieur
      ].filter((value): value is string => typeof value === 'string' && value.length > 0)
        .forEach(value => nodes.add(value));
    });
    return Array.from(nodes);
  }

  async validateStratigraphie(stratigraphie: ApiStratigraphie): Promise<ValidationResult> {
    this.ensureCacheIsReady();

    const cacheKey = stratigraphie?.stratigraphie_uuid;
    if (cacheKey && this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey);
      return {...cached};
    }
    if (cacheKey && this.validationPromises.has(cacheKey)) {
      const pending = await this.validationPromises.get(cacheKey);
      return {...pending};
    }

    const task = this.validateWithPreferredEngine(stratigraphie);
    if (cacheKey) {
      this.validationPromises.set(cacheKey, task);
    }

    try {
      const result = await task;
      if (cacheKey) {
        this.validationCache.set(cacheKey, result);
      }
      return {...result};
    } finally {
      if (cacheKey) {
        this.validationPromises.delete(cacheKey);
      }
    }
  }

  private exploreStratiLevel(
    origin_graph: StratigraphieDescriptor,
    uuid: linkedFaitUsUuid,
    history: linkedFaitUsUuidHistory,
    alreadyCheckingContemporain: boolean = false,
    context?: ExplorationContext
  ): StratigraphieDescriptor {

    if (context) {
      context.depth++;
      context.nodesExplored++;

      if (context.depth > context.maxDepth) {
        LOG.warn.log(
          {...CONTEXT, action: 'exploreStratiLevel'},
          `Max recursion depth reached (${context.maxDepth}). Stopping exploration.`
        );
        return this.graphCopy(origin_graph);
      }

      if (context.nodesExplored > context.maxNodes) {
        LOG.warn.log(
          {...CONTEXT, action: 'exploreStratiLevel'},
          `Max nodes explored (${context.maxNodes}). Stopping exploration.`
        );
        return this.graphCopy(origin_graph);
      }

      const elapsed = Date.now() - context.startTime;
      if (elapsed > context.timeout) {
        LOG.warn.log(
          {...CONTEXT, action: 'exploreStratiLevel'},
          `Validation timeout (${elapsed}ms > ${context.timeout}ms). Stopping exploration.`
        );
        return this.graphCopy(origin_graph); // Retour sans exploration
      }
    }

    const graph = this.graphCopy(origin_graph);
    graph.uuid = uuid;

    const step = {
      us_origin: origin_graph.uuid.us,
      fait_origin: origin_graph.uuid.fait,
      strati_target: uuid.stratigraphie_uuid,
      direction: uuid.direction,
      us_target: uuid.us,
      fait_target: uuid.fait,
    };

    LOG.debug.log({...CONTEXT, action: 'exploreStratiLevel', message: 'STEP : '},
      'from ' + (step.us_origin ?? step.fait_origin)?.substring(0, 4) +
      ' through ' + (step.strati_target)?.substring(0, 4) +
      ' to ' + (step.us_target ?? step.fait_target)?.substring(0, 4) +
      ' in the ' + step.direction +
      (context ? ` [depth: ${context.depth}, explored: ${context.nodesExplored}]` : '')
    );

    const alreadyVisited = (uuid.us && history.us.has(uuid.us))
      || (uuid.fait && history.fait.has(uuid.fait));

    if (alreadyVisited) {
      LOG.debug.log({...CONTEXT, action: 'CANCEL exploration of StratiLevel. Dead End Loop detected.'}, {uuid, alreadyCheckingContemporain});
      if (context) context.depth--;
      return graph;
    }

    const addedUs = uuid.us ? !history.us.has(uuid.us) : false;
    const addedFait = uuid.fait ? !history.fait.has(uuid.fait) : false;

    if (addedUs) {
      history.us.add(uuid.us);
    }
    if (addedFait) {
      history.fait.add(uuid.fait);
    }

    const relations = this.getConnectedRelations(uuid, uuid.stratigraphie_uuid);

    relations.forEach(s => {
      if (s.is_contemporain){
        const target = [
          {
            us: s.us_posterieur,
            fait: s.fait_posterieur,
            direction: StratDirection.future,
            stratigraphie_uuid: s.stratigraphie_uuid
          },
          {
            fait: s.fait_anterieur,
            us: s.us_anterieur,
            direction: StratDirection.past,
            stratigraphie_uuid: s.stratigraphie_uuid
          }
        ].filter(x => (x.us || x.fait))
          .filter(val => (areEqualNotNull([val.us, graph.uuid.us]) || areEqualNotNull([val.fait, graph.uuid.fait])))
          .filter(val => val);

        target.forEach(val => {
          LOG.debug.log({...CONTEXT, action: 'Should only enter once !'}, target.length);
          const past_check = this.checkPast(graph, val);
          const future_check = this.checkFuture(graph, val);
          const present_check = this.checkPresent(graph, val);

          if(!past_check && !future_check) {
            if (present_check) {
              LOG.debug.log({...CONTEXT, action: '// all good'});
            } else {
              graph.contemporain.add(
                this.exploreStratiLevel(graph, val, history, true, context)
              );
            }
          } else {
            throw({graph, error: new Error('PARADOX detected : Found same value in: futur(' + future_check + ') past(' + past_check + ') present(' + present_check +')')}) ;
          }
        });
      } else {
        if (areEqualNotNull([s.us_anterieur, uuid.us]) || areEqualNotNull([s.fait_anterieur, uuid.fait])) {
          const val = {
            us: s.us_posterieur,
            fait: s.fait_posterieur,
            direction: StratDirection.future,
            stratigraphie_uuid: s.stratigraphie_uuid
          };

          const past_check = this.checkPast(graph, val);
          const future_check = this.checkFuture(graph, val);
          const present_check = this.checkPresent(graph, val);

          if( !past_check && !present_check) {
            if (future_check) {
              LOG.debug.log({...CONTEXT, action: '// all good'});
            } else {
              graph.posterieur.add(
                this.exploreStratiLevel(graph, val, history, false, context)
              );
            }
          } else {
            LOG.debug.log({...CONTEXT, message: 'check past'}, past_check);
            LOG.debug.log({...CONTEXT, message: 'check present'}, present_check);
            LOG.debug.log({...CONTEXT}, val);
            throw({graph, val, error: new Error('PARADOX detected : Found same value in: futur(' + future_check + ') past(' + past_check + ') present(' + present_check +')')}) ;
          }
        } else if (areEqualNotNull([s.us_posterieur, uuid.us]) || areEqualNotNull([s.fait_posterieur, uuid.fait])) {
          const val = {
            us: s.us_anterieur,
            fait: s.fait_anterieur,
            direction: StratDirection.past,
            stratigraphie_uuid: s.stratigraphie_uuid
          };

          const past_check = this.checkPast(graph, val);
          const future_check = this.checkFuture(graph, val);
          const present_check = this.checkPresent(graph, val);

          if(!future_check && !present_check) {
            if (past_check) {
              LOG.debug.log({...CONTEXT, action: '// all good'});
            } else {
              graph.anterieur.add(
                this.exploreStratiLevel(graph, val, history, false, context)
              );
            }
          } else {
            throw({graph, error: new Error('PARADOX detected : Found same value in: futur(' + future_check + ') past(' + past_check + ') present(' + present_check +')')}) ;
          }
        } else {
          throw({graph, error: new Error('YOU LOST ?')}) ;
        }
      }
    });

    if (addedUs) {
      history.us.delete(uuid.us);
    }
    if (addedFait) {
      history.fait.delete(uuid.fait);
    }

    if (context) context.depth--;

    return graph;
  }

  /// check if UUID is in past; return true if found
  private checkPast(graph: StratigraphieDescriptor, uuid: linkedFaitUsUuid): boolean {
    const visited = new Set<StratigraphieDescriptor>();
    const stack: StratigraphieDescriptor[] = [graph];

    while (stack.length) {
      const current = stack.pop();
      if (!current || visited.has(current)) {
        continue;
      }
      visited.add(current);

      for (const sibling of current.contemporain) {
        stack.push(sibling);
      }

      for (const previous of current.anterieur) {
        if (areEqualNotNull([previous.uuid.us, uuid.us]) || areEqualNotNull([previous.uuid.fait, uuid.fait])) {
          LOG.debug.log({...CONTEXT, action: 'FOUND PAST OCCURENCE'}, {current: previous, target: uuid});
          return true;
        }
        stack.push(previous);
      }
    }

    return false;
  }
  /// check if UUID is in future; return true if found
  private checkFuture(graph: StratigraphieDescriptor, uuid: linkedFaitUsUuid): boolean {
    const visited = new Set<StratigraphieDescriptor>();
    const stack: StratigraphieDescriptor[] = [graph];

    while (stack.length) {
      const current = stack.pop();
      if (!current || visited.has(current)) {
        continue;
      }
      visited.add(current);

      for (const sibling of current.contemporain) {
        stack.push(sibling);
      }

      for (const next of current.posterieur) {
        if (areEqualNotNull([next.uuid.us, uuid.us]) || areEqualNotNull([next.uuid.fait, uuid.fait])) {
          LOG.debug.log({...CONTEXT, action: 'FOUND FUTUR OCCURENCE'}, {current: next, target: uuid});
          return true;
        }
        stack.push(next);
      }
    }

    return false;
  }

  /// check if UUID is in Present; return true if found
  checkPresent(graph: StratigraphieDescriptor, uuid: linkedFaitUsUuid){
    for (const sibling of graph.contemporain) {
      if (areEqualNotNull([sibling.uuid.us, uuid.us]) || areEqualNotNull([sibling.uuid.fait, uuid.fait]))  {
        LOG.debug.log({...CONTEXT, action: 'FOUND PRESENT OCCURENCE'}, {sibling, target: uuid});
        return true;
      }
    }
    return false;
  }


  private graphCopy(graph: StratigraphieDescriptor): StratigraphieDescriptor {
    return {
      uuid:  graph.uuid,
      strati_uuid: graph.strati_uuid,
      anterieur: new Set<StratigraphieDescriptor>(),
      contemporain: new Set<StratigraphieDescriptor>(),
      posterieur: new Set<StratigraphieDescriptor>(),
    };
  }

  /**
   * Récupère toutes les stratigraphies connectées au point donné (us/fait), en excluant l’élément sur lequel on raisonne déjà.
   */
  private getConnectedRelations(uuid: linkedFaitUsUuid, stratiToSkip?: string): ApiStratigraphie[] {
    const relations = new Set<ApiStratigraphie>();
    const keys = [
      uuid.us ? this.buildNodeKey('US', uuid.us) : null,
      uuid.fait ? this.buildNodeKey('FAIT', uuid.fait) : null,
    ].filter(Boolean) as string[];

    keys.forEach(key => {
      const bucket = this.relationsByNode.get(key);
      if (!bucket) {
        return;
      }
      bucket.forEach(rel => {
        if (rel?.live !== false && rel?.stratigraphie_uuid !== stratiToSkip) {
          relations.add(rel);
        }
      });
    });

    return Array.from(relations);
  }

  /**
   * Construit / reconstruit totalement le cache.
   * Cette étape est volontairement lourde mais n’est appelée que lors d’un changement de données.
   */
  private rebuildCache(): void {
    const list = this.w.data().objects.stratigraphie.all.list?.map(item => item.item) ?? [];
    this.liveRelations = list.filter(rel => rel && rel.live !== false);

    this.relationsByUuid.clear();
    this.relationsByNode.clear();
    this.liveRelations.forEach(rel => {
      if (!rel?.stratigraphie_uuid) {
        return;
      }
      this.relationsByUuid.set(rel.stratigraphie_uuid, rel);
      [
        rel.us_anterieur ? this.buildNodeKey('US', rel.us_anterieur) : null,
        rel.us_posterieur ? this.buildNodeKey('US', rel.us_posterieur) : null,
        rel.fait_anterieur ? this.buildNodeKey('FAIT', rel.fait_anterieur) : null,
        rel.fait_posterieur ? this.buildNodeKey('FAIT', rel.fait_posterieur) : null,
      ].filter(Boolean).forEach(key => {
        if (!this.relationsByNode.has(key)) {
          this.relationsByNode.set(key, new Set<ApiStratigraphie>());
        }
        this.relationsByNode.get(key).add(rel);
      });
    });

    this.validationCache.clear();
    this.validationPromises.clear();
    this.workerReady = false;
    this.workerGraphPromise = null;
    this.workerFailureLogged = false;
    if (this.workerSupported) {
      this.scheduleWorkerGraphSync();
    }
    this.cacheReady = true;
    this.clearEntityCaches();
  }

  private ensureCacheIsReady(): void {
    if (!this.cacheReady) {
      this.rebuildCache();
    }
  }

  private clearEntityCaches(): void {
    this.usTagCache.clear();
    this.faitTagCache.clear();
    this.usToFaitCache.clear();
    this.faitToUsCache.clear();
    this.knownUs.clear();
    this.knownFaits.clear();
  }

  private buildNodeKey(type: 'US' | 'FAIT', uuid: string): string {
    return `${type}:${uuid}`;
  }

  /**
   * principal method that runs all stratigraphic validation checks
   * @param newStrati the new stratigraphie to validate
   * @param existingRelations the list of existing stratigraphies to check against
   * @returns ValidationResult indicating if the new stratigraphy is valid or not
   */
  public validateNewStratigraphie(newStrati: ApiStratigraphie, existingRelations: ApiStratigraphie[]): ValidationResult {
    const startTime = performance.now();
    // List of validators to execute
    const validators = [
      { fn: this.checkFaitUSContainmentContradiction.bind(this), type: 'containment', name: 'Containment Check' },
      { fn: this.checkFaitRelationConsistency.bind(this), type: 'consistency', name: 'Consistency Check' },
      { fn: this.checkAnteriorPosteriorContradiction.bind(this), type: 'temporal', name: 'Temporal Check' },
      { fn: this.checkCycleContradiction.bind(this), type: 'cycle', name: 'Cycle Check' }
    ];

    for (const validator of validators) {
      const validatorStartTime = performance.now();

      const result = validator.fn(newStrati, existingRelations);

      const validatorEndTime = performance.now();

      if (!result.result) {
        const totalTime = performance.now() - startTime;

        // Ajouter le type de paradoxe au résultat
        return {
          result: result.result,
          message: result.message,
          paradoxType: validator.type
        };
      }
    }

    const totalTime = performance.now() - startTime;

    return { result: true };
  }

  /**
   * checking for direct anterior/posterior/contemporary contradictions
   * @param newStrati The new stratigraphic relationship to validate
   * @param existingRelations The existing stratigraphic relationships
   * @returns An object containing the validation result and an error message if applicable
   */
  checkAnteriorPosteriorContradiction(newStrati: ApiStratigraphie, existingRelations: ApiStratigraphie[]): ValidationResult {
    // Extract identifiers to simplify comparisons
    const newUSAnterior = newStrati.us_anterieur;
    const newUSPosterior = newStrati.us_posterieur;
    const newFaitAnterior = newStrati.fait_anterieur;
    const newFaitPosterior = newStrati.fait_posterieur;
    const isContemporary = newStrati.is_contemporain;

    // Iterate over existing relationships to detect contradictions
    for (const relation of existingRelations) {
      if (!relation.live) continue;

      // Case 1: Anterior/posterior contradiction with US
      if (newUSAnterior && newUSPosterior &&
        relation.us_anterieur === newUSPosterior &&
        relation.us_posterieur === newUSAnterior &&
        !isContemporary && !relation.is_contemporain) {
        return {
          result: false,
          message:  `Contradiction détectée : l'US ${this.getUsTag(newUSAnterior)} ne peut pas être antérieure à l'US ${this.getUsTag(newUSPosterior)} car une relation inverse existe déjà.`
        };
      }

      // Case 2: Contradiction with a contemporary relationship
      if (isContemporary) {
        if ((newUSAnterior && newUSPosterior &&
            ((relation.us_anterieur === newUSAnterior && relation.us_posterieur === newUSPosterior) ||
              (relation.us_anterieur === newUSPosterior && relation.us_posterieur === newUSAnterior))) &&
          !relation.is_contemporain) {
          return {
            result: false,
            message: `Contradiction détectée : les US ${this.getUsTag(newUSAnterior)} et ${this.getUsTag(newUSPosterior)} ne peuvent pas être contemporaines car une relation hiérarchique existe déjà entre elles.`
          };
        }
      }

      // Similar cases for Faits
      if (newFaitAnterior && newFaitPosterior &&
        relation.fait_anterieur === newFaitPosterior &&
        relation.fait_posterieur === newFaitAnterior &&
        !isContemporary && !relation.is_contemporain) {
        return {
          result: false,
          message: `Contradiction détectée : le Fait ${this.getFaitTag(newFaitAnterior)} ne peut pas être antérieur au Fait ${this.getFaitTag(newFaitPosterior)} car une relation inverse existe déjà.`
        };
      }

      if (isContemporary) {
        if ((newFaitAnterior && newFaitPosterior &&
            ((relation.fait_anterieur === newFaitAnterior && relation.fait_posterieur === newFaitPosterior) ||
              (relation.fait_anterieur === newFaitPosterior && relation.fait_posterieur === newFaitAnterior))) &&
          !relation.is_contemporain) {
          return {
            result: false,
            message: `Contradiction détectée : les Faits ${this.getFaitTag(newFaitAnterior)} et ${this.getFaitTag(newFaitPosterior)} ne peuvent pas être contemporains car une relation hiérarchique existe déjà entre eux.`
          };
        }
      }

      // case 3: anterior Fait and posterior US contradicting an existing inverse relationship
      if (newFaitAnterior && newUSPosterior &&
        relation.us_anterieur === newUSPosterior &&
        relation.fait_posterieur === newFaitAnterior &&
        !isContemporary && !relation.is_contemporain) {
        return {
          result: false,
          message: `Contradiction détectée : le Fait ${this.getFaitTag(newFaitAnterior)} ne peut pas être antérieur à l'US ${this.getUsTag(newUSPosterior)} car une relation inverse existe déjà.`
        };
      }

      // case 4 : anterior US and posterior Fait contradicting an existing inverse relationship
      if (newUSAnterior && newFaitPosterior &&
        relation.fait_anterieur === newFaitPosterior &&
        relation.us_posterieur === newUSAnterior &&
        !isContemporary && !relation.is_contemporain) {
        return {
          result: false,
          message: `Contradiction détectée : l'US ${this.getUsTag(newUSAnterior)} ne peut pas être antérieure au Fait ${this.getFaitTag(newFaitPosterior)} car une relation inverse existe déjà.`
        };
      }

      // Cas 5: Relations contemporaines qui contredisent des relations temporelles (US-Fait)
      if (isContemporary) {
        if (newUSAnterior && newFaitPosterior &&
          ((relation.us_anterieur === newUSAnterior && relation.fait_posterieur === newFaitPosterior) ||
            (relation.us_posterieur === newUSAnterior && relation.fait_anterieur === newFaitPosterior)) &&
          !relation.is_contemporain) {
          return {
            result: false,
            message: `Contradiction détectée : l'US ${this.getUsTag(newUSAnterior)} et le Fait ${this.getFaitTag(newFaitPosterior)} ne peuvent pas être contemporains car une relation hiérarchique existe déjà entre eux.`
          };
        }

        if (newFaitAnterior && newUSPosterior &&
          ((relation.fait_anterieur === newFaitAnterior && relation.us_posterieur === newUSPosterior) ||
            (relation.fait_posterieur === newFaitAnterior && relation.us_anterieur === newUSPosterior)) &&
          !relation.is_contemporain) {
          return {
            result: false,
            message: `Contradiction détectée : le Fait ${this.getFaitTag(newFaitAnterior)} et l'US ${this.getUsTag(newUSPosterior)} ne peuvent pas être contemporains car une relation hiérarchique existe déjà entre eux.`
          };
        }
      }

      // une relation contemporaine existante
      if (!isContemporary && relation.is_contemporain) {
        // Cas US-Fait : Nouvelle relation hiérarchique contredisant une relation contemporaine existante
        if (newUSPosterior && newFaitAnterior) {
          // Vérifier si les mêmes entités existent dans une relation contemporaine
          if ((relation.us_anterieur === newUSPosterior && relation.fait_posterieur === newFaitAnterior) ||
            (relation.us_posterieur === newUSPosterior && relation.fait_anterieur === newFaitAnterior) ||
            (relation.us_anterieur === newUSPosterior && relation.fait_anterieur === newFaitAnterior) ||
            (relation.us_posterieur === newUSPosterior && relation.fait_posterieur === newFaitAnterior)) {
            return {
              result: false,
              message: `Contradiction détectée : l'US ${this.getUsTag(newUSPosterior)} ne peut pas être postérieure au Fait ${this.getFaitTag(newFaitAnterior)} car ils sont déjà définis comme contemporains.`
            };
          }
        }

        // Cas Fait-US : Nouvelle relation hiérarchique contredisant une relation contemporaine existante
        if (newFaitPosterior && newUSAnterior) {
          // Vérifier si les mêmes entités existent dans une relation contemporaine
          if ((relation.fait_anterieur === newFaitPosterior && relation.us_posterieur === newUSAnterior) ||
            (relation.fait_posterieur === newFaitPosterior && relation.us_anterieur === newUSAnterior) ||
            (relation.fait_anterieur === newFaitPosterior && relation.us_anterieur === newUSAnterior) ||
            (relation.fait_posterieur === newFaitPosterior && relation.us_posterieur === newUSAnterior)) {
            return {
              result: false,
              message: `Contradiction détectée : le Fait ${this.getFaitTag(newFaitPosterior)} ne peut pas être postérieur à l'US ${this.getUsTag(newUSAnterior)} car ils sont déjà définis comme contemporains.`
            };
          }
        }

        // Cas US-US : Nouvelle relation hiérarchique contredisant une relation contemporaine existante
        if (newUSAnterior && newUSPosterior) {
          // Vérifier si les mêmes US existent dans une relation contemporaine
          if ((relation.us_anterieur === newUSAnterior && relation.us_posterieur === newUSPosterior) ||
            (relation.us_posterieur === newUSAnterior && relation.us_anterieur === newUSPosterior)) {
            return {
              result: false,
              message: `Contradiction détectée : l'US ${this.getUsTag(newUSPosterior)} ne peut pas être postérieure à l'US ${this.getUsTag(newUSAnterior)} car elles sont déjà définies comme contemporaines.`
            };
          }
        }

        // Cas Fait-Fait : Nouvelle relation hiérarchique contredisant une relation contemporaine existante
        if (newFaitAnterior && newFaitPosterior) {
          // Vérifier si les mêmes Faits existent dans une relation contemporaine
          if ((relation.fait_anterieur === newFaitAnterior && relation.fait_posterieur === newFaitPosterior) ||
            (relation.fait_posterieur === newFaitAnterior && relation.fait_anterieur === newFaitPosterior)) {
            return {
              result: false,
              message: `Contradiction détectée : le Fait ${this.getFaitTag(newFaitPosterior)} ne peut pas être postérieur au Fait ${this.getFaitTag(newFaitAnterior)} car ils sont déjà définis comme contemporains.`
            };
          }
        }
      }

    }

    // No contradiction detected
    return { result: true };
  }

  // Utility methods to get tags of US and Faits
  private getUsTag(usUuid: string): string {
    if (!usUuid) {
      return usUuid;
    }
    if (this.usTagCache.has(usUuid)) {
      return this.usTagCache.get(usUuid);
    }
    const us = this.w.data().objects.us.all.findByUuid(usUuid);
    const tag = us ? us.item.tag : usUuid;
    if (us) {
      this.knownUs.add(usUuid);
    }
    this.usTagCache.set(usUuid, tag);
    return tag;
  }

  private getFaitTag(faitUuid: string): string {
    if (!faitUuid) {
      return faitUuid;
    }
    if (this.faitTagCache.has(faitUuid)) {
      return this.faitTagCache.get(faitUuid);
    }
    const fait = this.w.data().objects.fait.all.findByUuid(faitUuid);
    const tag = fait ? fait.item.tag : faitUuid;
    if (fait) {
      this.knownFaits.add(faitUuid);
    }
    this.faitTagCache.set(faitUuid, tag);
    return tag;
  }


  /**
   * construct a directed graph from stratigraphic relationships
   * including US-Fait connections
   */
  private buildRelationGraph(relations: ApiStratigraphie[], newRelation: ApiStratigraphie): Map<string, Array<{to: string, relation: ApiStratigraphie}>> {

    const graph = new Map<string, Array<{to: string, relation: ApiStratigraphie}>>();

    // Initialize the graph
    relations.forEach(relation => {
      if (relation.us_anterieur && !graph.has(relation.us_anterieur)) {
        graph.set(relation.us_anterieur, []);
      }
      if (relation.us_posterieur && !graph.has(relation.us_posterieur)) {
        graph.set(relation.us_posterieur, []);
      }
      if (relation.fait_anterieur && !graph.has(relation.fait_anterieur)) {
        graph.set(relation.fait_anterieur, []);
      }
      if (relation.fait_posterieur && !graph.has(relation.fait_posterieur)) {
        graph.set(relation.fait_posterieur, []);
      }
    });

    const activeRelations = relations.filter(rel => rel.live);

    // Add edges based on relationships
    activeRelations.forEach(relation => {
      if (!relation.is_contemporain) {
        // for US-US relationships
        if (relation.us_anterieur && relation.us_posterieur) {
          if (!graph.get(relation.us_posterieur)) {
            graph.set(relation.us_posterieur, []);
          }

          graph.get(relation.us_posterieur).push({
            to: relation.us_anterieur,
            relation: relation
          });
        }
        // for Fait-Fait relationships
        else if (relation.fait_anterieur && relation.fait_posterieur) {
          if (!graph.get(relation.fait_posterieur)) {
            graph.set(relation.fait_posterieur, []);
          }

          graph.get(relation.fait_posterieur).push({
            to: relation.fait_anterieur,
            relation: relation
          });
        }

        // for US-Fait relationships
        if (relation.us_posterieur && relation.fait_anterieur) {
          // US postérieur → Fait antérieur
          if (!graph.get(relation.us_posterieur)) {
            graph.set(relation.us_posterieur, []);
          }

          graph.get(relation.us_posterieur).push({
            to: relation.fait_anterieur,
            relation: relation
          });
        }
        if (relation.fait_posterieur && relation.us_anterieur) {
          // Fait postérieur → US antérieur
          if (!graph.get(relation.fait_posterieur)) {
            graph.set(relation.fait_posterieur, []);
          }

          graph.get(relation.fait_posterieur).push({
            to: relation.us_anterieur,
            relation: relation
          });
        }
      }
    });
    // Propager les relations à travers les entités contemporaines
    // this.propagateRelationsThroughSynchronousEntities(graph, activeRelations);
    // this.addInheritedRelationsFromUSToFait(graph, activeRelations, newRelation);
    //this.addInheritedRelationsToGraph(graph, activeRelations, newRelation);

    return graph;
  }

  /**
   * cycle detection using DFS
   * @param graph
   * @private
   */
  private detectCycles(graph: Map<string, Array<{to: string, relation: ApiStratigraphie | any}>>): string[][] {
    const cycles: string[][] = [];
    const visitedGlobal = new Set<string>();

    // for each node in the graph.
    graph.forEach((_, startNode) => {
      if (!visitedGlobal.has(startNode)) {
        const visited = new Set<string>();
        const recStack = new Set<string>();
        const path: string[] = [];

        this.dfsDetectCycle(graph, startNode, visited, recStack, path, cycles);

        // Mark all nodes visited in this DFS as globally visited
        visited.forEach(node => visitedGlobal.add(node));
      }
    });

    return cycles;
  }

  /**
   * DFS helper function to detect cycles
   * @param graph
   * @param node
   * @param visited
   * @param recStack
   * @param path
   * @param cycles
   * @private
   */
  private dfsDetectCycle(
    graph: Map<string, Array<{to: string, relation: ApiStratigraphie | any}>>,
    node: string,
    visited: Set<string>,
    recStack: Set<string>,
    path: string[],
    cycles: string[][]
  ): void {

    // Mark the current node as visited and add to recursion stack
    visited.add(node);
    recStack.add(node);
    path.push(node);

    // explore neighbors
    const neighbors = graph.get(node) || [];

    for (const neighbor of neighbors) {
      const nextNode = neighbor.to;
      const relation = neighbor.relation;

      // ignore synchronous (contemporary) relations for cycle detection
      // because they do not imply a temporal order
      // But check US-Fait relations
      const isUseFaitAssociation = relation?.type === 'us-fait-association';

      if (relation?.is_contemporain && !isUseFaitAssociation) {
        continue;
      }

      // If node is already in recursion stack, we found a cycle
      if (recStack.has(nextNode)) {
        const cycleStart = path.indexOf(nextNode);
        const cycle = path.slice(cycleStart);

        // format cycle for display
        const formattedCycle = this.formatCycleForDisplay(cycle);

        cycles.push(cycle);
      }
      // if not visited, continue DFS
      else if (!visited.has(nextNode)) {
        this.dfsDetectCycle(graph, nextNode, visited, recStack, path, cycles);
      }
    }


    // withdraw node from recursion stack
    recStack.delete(node);
    path.pop();
  }

  /**
   * retrieve the tag of an element (US or Fait) from its UUID
   * @param uuid
   * @private
   */
  private getTagForElement(uuid: string): string {
    if (!uuid) {
      return uuid;
    }
    if (this.knownUs.has(uuid)) {
      return this.getUsTag(uuid);
    }
    if (this.knownFaits.has(uuid)) {
      return this.getFaitTag(uuid);
    }
    const usTag = this.getUsTag(uuid);
    if (this.knownUs.has(uuid)) {
      return usTag;
    }
    return this.getFaitTag(uuid);
  }

  /**
   * Format a cycle for display using the tags of US/Faits instead of UUIDs
   * @param cycle
   * @private
   */
  private formatCycleForDisplay(cycle: string[]): string {
    return cycle.map(uuid => this.getTagForElement(uuid)).join(' → ');
  }

  /**
   * Check for cycles in the stratigraphic relationships
   * @param newStrati
   * @param existingRelations
   */
  checkCycleContradiction(newStrati: ApiStratigraphie, existingRelations: ApiStratigraphie[]): ValidationResult {

    // 1. Construire un graphe complet incluant la nouvelle relation
    const allRelations = [...existingRelations, newStrati];
    const graph = this.buildRelationGraph(allRelations, newStrati);

    // Afficher le graphe complet pour débogage
    this.logCompleteGraph(graph, "Graphe stratigraphique complet");

    // 2. Détecter les cycles
    const cyclesDetected = this.detectCycles(graph);

    if (cyclesDetected.length > 0) {
      // Un ou plusieurs cycles détectés

      // Examiner chaque cycle
      for (const cycle of cyclesDetected) {

        // Vérifier si le cycle implique la nouvelle relation
        if (this.cycleInvolvesRelation(cycle, newStrati)) {
          const cycleId = this.formatCycleForDisplay(cycle);

          console.log("cycle ", cycle)
          console.log("cycle getTagForElement ", cycle.map(uuid => this.getTagForElement(uuid)))

          return {
            result: false,
            message: this.formatCycleErrorMessage(cycle, graph),
            paradoxType: 'cycle',
            cycleInfo: {
              cycleId: cycleId,
              cycleNodes : cycle.map(uuid => this.getTagForElement(uuid)),
              cycleNodesUUIDs: cycle
            }
          };
        }
      }

      // Des cycles ont été détectés, mais aucun n'implique la nouvelle relation
    } else {
    }

    // Aucun cycle problématique détecté
    return { result: true };
  }

  private logCompleteGraph(graph: Map<string, Array<{to: string, relation: any}>>, title: string = "Graphe complet"): void {

    graph.forEach((targets, source) => {
      const sourceName = this.getTagForElement(source);

      targets.forEach(target => {
        const targetName = this.getTagForElement(target.to);
        const relationType = target.relation.is_contemporain ? "contemporain" :
          (target.relation.propagated ? "propagé" :
            (target.relation.inherited ? "hérité" : "direct"));
      });
    });
  }

  /**
   * verfy if a detected cycle involves the new relation
   * @param cycle
   * @param relation
   * @private
   */
  private cycleInvolvesRelation(cycle: string[], relation: ApiStratigraphie): boolean {
    const relationElements = [
      relation.us_anterieur,
      relation.us_posterieur,
      relation.fait_anterieur,
      relation.fait_posterieur
    ].filter(Boolean);

    // Vérifiez que la relation est directement impliquée dans le cycle
    // Pour cela, nous devons trouver une paire d'éléments consécutifs dans le cycle
    // qui correspondent aux éléments de notre relation
    for (let i = 0; i < cycle.length; i++) {
      const current = cycle[i];
      const next = cycle[(i + 1) % cycle.length]; // prendre le suivant, ou revenir au début si c'est le dernier

      // Vérifier si cette arête du cycle correspond à notre relation
      // Pour une relation non-contemporaine
      if (!relation.is_contemporain) {
        if ((relationElements.includes(current) && relationElements.includes(next))) {
          // Vérifier si l'ordre correspond (anterieur -> posterieur)
          if (
            (relation.us_anterieur === next && relation.us_posterieur === current) ||
            (relation.fait_anterieur === next && relation.fait_posterieur === current) ||
            (relation.us_anterieur === next && relation.fait_posterieur === current) ||
            (relation.fait_anterieur === next && relation.us_posterieur === current)
          ) {
            return true;
          }
        }
      }
      // Pour une relation contemporaine
      else {
        if (relationElements.includes(current) && relationElements.includes(next)) {
          return true;
        }
      }
    }

    // Si nous n'avons trouvé aucune correspondance directe, cette relation n'est
    // pas directement impliquée dans le cycle
    return false;
  }


  /**
   * Formater un message d'erreur descriptif pour un cycle détecté avec héritage US → Fait
   */
  private formatCycleErrorMessage(cycle: string[], graph: Map<string, Array<{to: string, relation: ApiStratigraphie | any}>>): string {
    // reorganize the cycle to start with the current entity (active US or Fait)
    const reorganizedCycle = this.reorganizeCycleToStartWithCurrentEntity(cycle);

    const formattedCycle = this.formatCycleForDisplay(reorganizedCycle);

    // Vérifier si le cycle implique des relations héritées
    const hasInheritedRelations = this.cycleContainsInheritedRelations(cycle, graph);
    // Vérifier si le cycle implique des relations propagées via contemporanéité
    const hasPropagatedRelations = this.cycleContainsPropagatedRelations(cycle, graph);

    // Vérifier si le cycle implique à la fois des US et des Faits
    const containsUS = cycle.some(id => this.w.data().objects.us.all.findByUuid(id));
    const containsFait = cycle.some(id => this.w.data().objects.fait.all.findByUuid(id));

    if (hasPropagatedRelations) {
      return `Contradiction détectée : cycle stratigraphique impossible (${formattedCycle} → ${this.getTagForElement(reorganizedCycle[0])}).
      Ce cycle inclut des relations propagées via des entités contemporaines.
      Les US ou Faits contemporains partagent les mêmes relations stratigraphiques, ce qui crée un cycle.`;
    }

    if (hasInheritedRelations) {
      return `Contradiction détectée : cycle stratigraphique impossible (${formattedCycle} → ${this.getTagForElement(reorganizedCycle[0])}).
      Ce cycle contient des relations héritées entre des US et leur Fait.
      Les relations entre les US externes et les Faits créent implicitement des relations entre les Faits, ce qui génère un cycle.`;
    } else if (containsUS && containsFait) {
      return `Contradiction détectée : cycle stratigraphique impossible incluant à la fois des US et des Faits (${formattedCycle} → ${this.getTagForElement(reorganizedCycle[0])}). Cette contradiction crée un paradoxe temporel.`;
    } else {
      return `Contradiction détectée : cycle stratigraphique impossible (${formattedCycle} → ${this.getTagForElement(reorganizedCycle[0])}). Une unité stratigraphique ne peut pas être à la fois antérieure et postérieure à elle-même.`;
    }
  }

  /**
   * reorganize the cycle to start with the current entity (active US or Fait)
   */
  private reorganizeCycleToStartWithCurrentEntity(cycle: string[]): string[] {
    // detrermine the current selected US or Fait in the interface
    const currentUsUuid = this.w.data().objects.us.selected?.item?.us_uuid;
    const currentFaitUuid = this.w.data().objects.fait.selected?.item?.fait_uuid;

    // If one of the selected entities is in the cycle, reorganize to start with it
    let startIndex = -1;

    if (currentUsUuid && cycle.includes(currentUsUuid)) {
      startIndex = cycle.indexOf(currentUsUuid);
    } else if (currentFaitUuid && cycle.includes(currentFaitUuid)) {
      startIndex = cycle.indexOf(currentFaitUuid);
    }

    // if a current entity was found in the cycle, reorganize
    if (startIndex >= 0) {
      // create a new array that starts with the current entity
      return [...cycle.slice(startIndex), ...cycle.slice(0, startIndex)];
    }

    // else, return the original cycle
    return cycle;
  }

  /**
   * Vérifie si un cycle contient des relations héritées (dans les deux directions)
   */
  private cycleContainsInheritedRelations(cycle: string[], graph: Map<string, Array<{to: string, relation: ApiStratigraphie | any}>>): boolean {
    for (let i = 0; i < cycle.length; i++) {
      const current = cycle[i];
      const next = cycle[(i + 1) % cycle.length];

      const neighbors = graph.get(current) || [];
      const edgeToNext = neighbors.find(n => n.to === next);

      if (edgeToNext && edgeToNext.relation.inherited) {
        return true;
      }
    }

    return false;
  }

  /**
   * verfy if a stratigraphic relationship involves a Fait and its own US
   * @param newStrati
   * @param existingRelations
   */
  checkFaitUSContainmentContradiction(newStrati: ApiStratigraphie, existingRelations: ApiStratigraphie[]): ValidationResult {
    // verify if the relation involves a Fait and a US
    if ((newStrati.fait_anterieur && newStrati.us_posterieur) ||
      (newStrati.us_anterieur && newStrati.fait_posterieur)) {

      // retrieve the involved Fait and US
      const faitUuid = newStrati.fait_anterieur || newStrati.fait_posterieur;
      const usUuid = newStrati.us_anterieur || newStrati.us_posterieur;

      // retrieve the US to check if it belongs to the Fait
      const usObject = this.w.data().objects.us.all.findByUuid(usUuid);

      // verify if the US belongs to the Fait in question
      if (usObject && usObject.item && usObject.item.fait_uuid === faitUuid) {
        return {
          result: false,
          message: `Relation interdite : L'US ${this.getUsTag(usUuid)} appartient déjà au Fait ${this.getFaitTag(faitUuid)}. Il n'est pas possible de créer une relation stratigraphique directe entre un Fait et ses propres US.`
        };
      }
    }

    return { result: true };
  }

  /**
   * Enrich the graph by adding inherited relations to US belonging to Faits
   * enricher
   * @param graph
   * @param relations
   * @private
   */
  private addInheritedRelationsToGraph(
    graph: Map<string, Array<{to: string, relation: ApiStratigraphie | any}>>,
    relations: ApiStratigraphie[],
    newRelation: ApiStratigraphie // Relation en cours de validation
  ): void {
    // retrieve all US with their associated Fait
    const usFaitMap = new Map<string, string>(); // Map US UUID -> Fait UUID
    const faitUsMap = new Map<string, string[]>(); // Map Fait UUID -> Array of US UUIDs

    this.w.data().objects.us.all.list.forEach(usObj => {
      const us = usObj.item;
      if (us.fait_uuid && us.live) {
        usFaitMap.set(us.us_uuid, us.fait_uuid);

        if (!faitUsMap.has(us.fait_uuid)) {
          faitUsMap.set(us.fait_uuid, []);
        }
        faitUsMap.get(us.fait_uuid).push(us.us_uuid);
      }
    });

    // for each relation involving a Fait, add inherited relations to its US
    relations
      .filter(rel => rel.live && !rel.is_contemporain)
      // Exclure la relation en cours de validation
      .filter(rel => {
        return !(
          (rel.us_anterieur === newRelation.us_anterieur && rel.us_posterieur === newRelation.us_posterieur) ||
          (rel.fait_anterieur === newRelation.fait_anterieur && rel.fait_posterieur === newRelation.fait_posterieur) ||
          (rel.us_anterieur === newRelation.us_anterieur && rel.fait_posterieur === newRelation.fait_posterieur) ||
          (rel.fait_anterieur === newRelation.fait_anterieur && rel.us_posterieur === newRelation.us_posterieur)
        );
      })
      .forEach(relation => {
        // case 1: Anterior Fait (the US of the Fait inherit the "anterior" relation)
        if (relation.fait_anterieur) {
          const usArray = faitUsMap.get(relation.fait_anterieur) || [];

          usArray.forEach(usUuid => {
            // create edge from each US of the Fait to the same destination as the Fait
            if (relation.us_posterieur) {
              // US of the Fait -> Posterior US
              if (!graph.has(usUuid)) {
                graph.set(usUuid, []);
              }
              graph.get(usUuid).push({
                to: relation.us_posterieur,
                relation: {
                  ...relation,
                  inherited: true,
                  source: `inherited from Fait ${this.getFaitTag(relation.fait_anterieur)}`
                }
              });
            }

            if (relation.fait_posterieur) {
              // US of the Fait -> Posterior Fait
              if (!graph.has(usUuid)) {
                graph.set(usUuid, []);
              }
              graph.get(usUuid).push({
                to: relation.fait_posterieur,
                relation: {
                  ...relation,
                  inherited: true,
                  source: `inherited from Fait ${this.getFaitTag(relation.fait_anterieur)}`
                }
              });
            }
          });
        }

        // case 2: Posterior Fait (the US of the Fait inherit the "posterior" relation)
        if (relation.fait_posterieur) {
          const usArray = faitUsMap.get(relation.fait_posterieur) || [];

          usArray.forEach(usUuid => {
            // create edge from each US of the Fait to the same destination as the Fait
            if (relation.us_anterieur) {
              // US of the Fait -> Anterior US
              if (!graph.has(usUuid)) {
                graph.set(usUuid, []);
              }
              graph.get(usUuid).push({
                to: relation.us_anterieur,
                relation: {
                  ...relation,
                  inherited: true,
                  source: `inherited from Fait ${this.getFaitTag(relation.fait_posterieur)}`
                }
              });
            }

            if (relation.fait_anterieur) {
              // US of the Fait -> Anterior Fait
              if (!graph.has(usUuid)) {
                graph.set(usUuid, []);
              }
              graph.get(usUuid).push({
                to: relation.fait_anterieur,
                relation: {
                  ...relation,
                  inherited: true,
                  source: `inherited from Fait ${this.getFaitTag(relation.fait_posterieur)}`
                }
              });
            }
          });
        }
      });
  }

  /**
   * Enrich the graph by adding inherited relations from US to their Faits
   * excluding the relation being validated
   * @param graph
   * @param relations
   * @private
   */
  private addInheritedRelationsFromUSToFait(
    graph: Map<string, Array<{to: string, relation: ApiStratigraphie | any}>>,
    relations: ApiStratigraphie[],
    newRelation: ApiStratigraphie
  ): void {
    // retrieve all US with their associated Fait
    const usFaitMap = new Map<string, string>(); // Map US UUID -> Fait UUID
    const faitUsMap = new Map<string, string[]>(); // Map Fait UUID -> Array of US UUIDs

    this.w.data().objects.us.all.list.forEach(usObj => {
      const us = usObj.item;
      if (us.fait_uuid && us.live) {
        usFaitMap.set(us.us_uuid, us.fait_uuid);

        if (!faitUsMap.has(us.fait_uuid)) {
          faitUsMap.set(us.fait_uuid, []);
        }
        faitUsMap.get(us.fait_uuid).push(us.us_uuid);
      }
    });

    // for each relation involving a US, propagate it to its Fait
    relations
      .filter(rel => rel.live && !rel.is_contemporain)
      // Exclure la relation en cours de validation
      .filter(rel => {
        return !(
          (rel.us_anterieur === newRelation.us_anterieur && rel.us_posterieur === newRelation.us_posterieur) ||
          (rel.fait_anterieur === newRelation.fait_anterieur && rel.fait_posterieur === newRelation.fait_posterieur) ||
          (rel.us_anterieur === newRelation.us_anterieur && rel.fait_posterieur === newRelation.fait_posterieur) ||
          (rel.fait_anterieur === newRelation.fait_anterieur && rel.us_posterieur === newRelation.us_posterieur)
        );
      })
      .forEach(relation => {
        // Cas 1: US antérieure - propager au Fait
        if (relation.us_anterieur && usFaitMap.has(relation.us_anterieur)) {
          const faitUuid = usFaitMap.get(relation.us_anterieur);

          // verify that the other element of the relation does not belong to the same Fait
          let targetIsExternal = true;

          if (relation.us_posterieur && usFaitMap.has(relation.us_posterieur)) {
            // if the posterior US belongs to the same Fait, do not propagate
            if (usFaitMap.get(relation.us_posterieur) === faitUuid) {
              targetIsExternal = false;
            }
          }


          // propagate only for external relations
          if (targetIsExternal) {
            // initialize the node of the Fait if it does not exist
            if (!graph.has(faitUuid)) {
              graph.set(faitUuid, []);
            }

            // add the relation from the Fait to the external entity
            if (relation.us_posterieur) {
              graph.get(faitUuid).push({
                to: relation.us_posterieur,
                relation: {
                  ...relation,
                  inherited: true,
                  source: `inherited from US ${this.getUsTag(relation.us_anterieur)}`
                }
              });
            }

            if (relation.fait_posterieur) {
              graph.get(faitUuid).push({
                to: relation.fait_posterieur,
                relation: {
                  ...relation,
                  inherited: true,
                  source: `inherited from US ${this.getUsTag(relation.us_anterieur)}`
                }
              });
            }
          }
        }

        // Cas 2: US postérieure - propager au Fait
        if (relation.us_posterieur && usFaitMap.has(relation.us_posterieur)) {
          const faitUuid = usFaitMap.get(relation.us_posterieur);

          // verify that the other element of the relation does not belong to the same Fait
          let targetIsExternal = true;

          if (relation.us_anterieur && usFaitMap.has(relation.us_anterieur)) {
            // if the anterior US belongs to the same Fait, do not propagate
            if (usFaitMap.get(relation.us_anterieur) === faitUuid) {
              targetIsExternal = false;
            }
          }

          // only propagate for external relations
          if (targetIsExternal) {
            // inialize the node of the Fait if it does not exist
            if (!graph.has(faitUuid)) {
              graph.set(faitUuid, []);
            }

            // add  the relation from the Fait to the external entity
            if (relation.us_anterieur) {
              graph.get(faitUuid).push({
                to: relation.us_anterieur,
                relation: {
                  ...relation,
                  inherited: true,
                  source: `inherited from US ${this.getUsTag(relation.us_posterieur)}`
                }
              });
            }

            if (relation.fait_anterieur) {
              graph.get(faitUuid).push({
                to: relation.fait_anterieur,
                relation: {
                  ...relation,
                  inherited: true,
                  source: `inherited from US ${this.getUsTag(relation.us_posterieur)}`
                }
              });
            }
          }
        }
      });
  }

  /**
   * Enrichit le graphe en propageant les relations à travers les entités contemporaines
   */
  private propagateRelationsThroughSynchronousEntities(
    graph: Map<string, Array<{to: string, relation: any}>>,
    relations: ApiStratigraphie[]
  ): void {
    // Construct a graph of synchronous relationships
    const synchronousGraph = new Map<string, string[]>();

    // collect all synchronous relations
    relations.filter(rel => rel.live && rel.is_contemporain).forEach(relation => {
      // Relations US-US, Fait-Fait, US-Fait
      if (relation.us_anterieur && relation.us_posterieur) {
        this.addSynchronousLink(synchronousGraph, relation.us_anterieur, relation.us_posterieur);
        this.addSynchronousLink(synchronousGraph, relation.us_posterieur, relation.us_anterieur);
      }
      if (relation.fait_anterieur && relation.fait_posterieur) {
        this.addSynchronousLink(synchronousGraph, relation.fait_anterieur, relation.fait_posterieur);
        this.addSynchronousLink(synchronousGraph, relation.fait_posterieur, relation.fait_anterieur);
      }
      if (relation.us_anterieur && relation.fait_posterieur) {
        this.addSynchronousLink(synchronousGraph, relation.us_anterieur, relation.fait_posterieur);
        this.addSynchronousLink(synchronousGraph, relation.fait_posterieur, relation.us_anterieur);
      }
      if (relation.fait_anterieur && relation.us_posterieur) {
        this.addSynchronousLink(synchronousGraph, relation.fait_anterieur, relation.us_posterieur);
        this.addSynchronousLink(synchronousGraph, relation.us_posterieur, relation.fait_anterieur);
      }
    });

    // calculate entity groups
    const synchronousGroups = this.computeSynchronousGroups(synchronousGraph);

    //for each group, propagate relations between group members
    let hasChanges = true;
    let iterations = 0;
    const MAX_ITERATIONS = 20; // avoid potential infinite loops

    // repeat the propagation until no new relation is added
    while (hasChanges && iterations < MAX_ITERATIONS) {
      hasChanges = false;
      iterations++;

      // for each group of synchronous entities
      synchronousGroups.forEach(group => {
        if (group.length <= 1) return; // ignore groups of size 1

        // for each pair of entities in the group
        for (let i = 0; i < group.length; i++) {
          const entity1 = group[i];
          const relations1 = graph.get(entity1) || [];

          // for each other entity in the group
          for (let j = 0; j < group.length; j++) {
            if (i === j) continue;

            const entity2 = group[j];


            // create the list if it does not exist
            if (!graph.has(entity2)) {
              graph.set(entity2, []);
            }

            // propagate each relation from entity1 to entity2
            for (const relation of relations1) {
              // don't propagate to entities in the same contemporary group
              if (!group.includes(relation.to)) {
                // verify if this relation already exists
                const existingRelation = graph.get(entity2).find(r => r.to === relation.to);

                if (!existingRelation) {
                  // add the propagated relation
                  graph.get(entity2).push({
                    to: relation.to,
                    relation: {
                      ...relation.relation,
                      inherited: true,
                      propagated: true,
                      source: `propagated from ${this.getTagForElement(entity1)} via contemporaneity`
                    }
                  });

                  hasChanges = true;
                }
              }
            }
          }
        }
      });
    }

    // propagate inverse relations
    this.propagateInverseRelations(graph, synchronousGroups);
  }

  private propagateInverseRelations(
    graph: Map<string, Array<{to: string, relation: any}>>,
    synchronousGroups: string[][]
  ): void {

    // construct a map of entities to their contemporary groups
    const entityToGroup = new Map<string, string[]>();
    synchronousGroups.forEach(group => {
      group.forEach(entity => {
        entityToGroup.set(entity, group);
      });
    });

    // for each relation A -> B, if B belongs to a contemporary group,
    // all members of that group should be considered as targeted by A
    graph.forEach((targets, source) => {
      const newRelations: Array<{to: string, relation: any}> = [];

      targets.forEach(target => {
        const group = entityToGroup.get(target.to);

        if (group && group.length > 1) {
          // propane the relation to all members of the contemporary group
          group.forEach(member => {
            if (member !== target.to && !targets.some(t => t.to === member)) {
              newRelations.push({
                to: member,
                relation: {
                  ...target.relation,
                  inherited: true,
                  propagated: true,
                  source: `propagated via contemporaneity with ${this.getTagForElement(target.to)}`
                }
              });
            }
          });
        }
      });

      // add the new relations
      if (newRelations.length > 0) {
        targets.push(...newRelations);
      }
    });
  }

  /**
   * Ajoute un lien dans le graphe des relations contemporaines
   */
  private addSynchronousLink(graph: Map<string, string[]>, from: string, to: string): void {
    if (!graph.has(from)) {
      graph.set(from, []);
    }
    if (!graph.get(from).includes(to)) {
      graph.get(from).push(to);
    }
  }

  private computeSynchronousGroups(synchronousGraph: Map<string, string[]>): string[][] {
    // structure DisjointSet for Union-Find algorithm
    class DisjointSet {
      private parent = new Map<string, string>();

      makeSet(x: string) {
        if (!this.parent.has(x)) {
          this.parent.set(x, x);
        }
      }

      find(x: string): string {
        if (this.parent.get(x) !== x) {
          this.parent.set(x, this.find(this.parent.get(x)));
        }
        return this.parent.get(x);
      }

      union(x: string, y: string) {
        const rootX = this.find(x);
        const rootY = this.find(y);
        if (rootX !== rootY) {
          this.parent.set(rootY, rootX);
        }
      }
    }

    const disjointSet = new DisjointSet();

    synchronousGraph.forEach((_, node) => {
      disjointSet.makeSet(node);
    });

    synchronousGraph.forEach((neighbors, node) => {
      neighbors.forEach(neighbor => {
        disjointSet.union(node, neighbor);
      });
    });

    const groupMap = new Map<string, string[]>();
    synchronousGraph.forEach((_, node) => {
      const root = disjointSet.find(node);
      if (!groupMap.has(root)) {
        groupMap.set(root, []);
      }
      groupMap.get(root).push(node);
    });

    const groups = Array.from(groupMap.values());

    return groups;
  }

  /**
   * Collecte les membres d'un groupe par parcours en profondeur
   */
  private dfsCollectGroup(
    node: string,
    graph: Map<string, string[]>,
    visited: Set<string>,
    group: string[]
  ): void {
    visited.add(node);
    group.push(node);

    const neighbors = graph.get(node) || [];
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        this.dfsCollectGroup(neighbor, graph, visited, group);
      }
    });
  }

  /**
   * Propage les relations au sein d'un groupe d'entités contemporaines
   */
  private propagateRelationsWithinGroup(
    graph: Map<string, Array<{to: string, relation: any}>>,
    group: string[]
  ): void {
    // Pour chaque paire d'entités dans le groupe
    for (let i = 0; i < group.length; i++) {
      const entity1 = group[i];

      // Récupérer toutes les relations de cette entité
      const relations1 = graph.get(entity1) || [];

      // Pour chaque autre entité du groupe
      for (let j = 0; j < group.length; j++) {
        if (i === j) continue; // Ne pas se comparer à soi-même

        const entity2 = group[j];

        // Assurer que le nœud existe dans le graphe
        if (!graph.has(entity2)) {
          graph.set(entity2, []);
        }

        // Propager chaque relation de entity1 vers entity2
        relations1.forEach(relation => {
          // Ne pas propager vers des entités du même groupe
          if (!group.includes(relation.to)) {
            // Vérifier si cette relation existe déjà
            const existingRelation = graph.get(entity2).find(r => r.to === relation.to);

            if (!existingRelation) {
              // Ajouter la relation propagée
              graph.get(entity2).push({
                to: relation.to,
                relation: {
                  ...relation.relation,
                  inherited: true,
                  propagated: true,
                  source: `propagated from ${this.getTagForElement(entity1)} via contemporaneity`
                }
              });
            }
          }
        });
      }
    }
  }

  /**
   * Vérifie si un cycle contient des relations propagées via contemporanéité
   */
  private cycleContainsPropagatedRelations(cycle: string[], graph: Map<string, Array<{to: string, relation: any}>>): boolean {
    for (let i = 0; i < cycle.length; i++) {
      const current = cycle[i];
      const next = cycle[(i + 1) % cycle.length];

      const neighbors = graph.get(current) || [];
      const edgeToNext = neighbors.find(n => n.to === next);

      if (edgeToNext && edgeToNext.relation.propagated) {
        return true;
      }
    }

    return false;
  }
  /**
   * verify the consistency of temporal relations between two Faits
   * A Fait cannot have contradictory relations with another Fait
   * @param newStrati
   * @param existingRelations
   */
  checkFaitRelationConsistency(newStrati: ApiStratigraphie, existingRelations: ApiStratigraphie[]): ValidationResult {
    const implicitCheck = this.checkImplicitFaitUsRelations(newStrati, existingRelations);
    if (!implicitCheck.result) {
      return implicitCheck;
    }

    // 1. Identifier les Faits et le type de relation dans la nouvelle relation stratigraphique
    const relation = this.determineRelationInfo(newStrati);

    // Si aucun Fait n'est impliqué ou si c'est le même Fait, pas de vérification nécessaire
    if (!relation || relation.fait1 === relation.fait2) {
      return { result: true };
    }

    // 2. Récupérer les listes d'US pour chaque Fait
    const fait1USList = this.getUSListForFait(relation.fait1);
    const fait2USList = this.getUSListForFait(relation.fait2);

    if (fait1USList.length === 0 || fait2USList.length === 0) {
      return { result: true };
    }

    // 3. Identifier les relations existantes entre les US des deux Faits
    const existingRelationTypes = this.identifyExistingRelations(
      relation.fait1,
      relation.fait2,
      existingRelations
    );

    // 4. Vérifier s'il y a incohérence entre la nouvelle relation et les existantes
    if (existingRelationTypes.size > 1 ||
      (existingRelationTypes.size === 1 &&
        !existingRelationTypes.has(relation.relationType))) {

      // Construction du message d'erreur détaillé
      return this.buildConflictErrorMessage(
        relation,
        existingRelationTypes,
        existingRelations.filter(rel => rel.live)
      );
    }

    return { result: true };
  }

  /**
   * Détermine les Faits impliqués et le type de relation
   */
  private determineRelationInfo(strati: ApiStratigraphie): {
    fait1: string;
    fait2: string;
    relationType: 'contemporain' | 'anterieur' | 'posterieur';
    elementType1: 'US' | 'Fait';
    elementType2: 'US' | 'Fait';
    elementId1: string;
    elementId2: string;
  } | null {
    let fait1 = null;
    let fait2 = null;
    let relationType = null;
    let elementType1 = null;
    let elementType2 = null;
    let elementId1 = null;
    let elementId2 = null;

    // Cas 1: Relation directe entre Faits
    if (strati.fait_anterieur && strati.fait_posterieur) {
      fait1 = strati.fait_anterieur;
      fait2 = strati.fait_posterieur;
      relationType = strati.is_contemporain ? 'contemporain' : 'anterieur';
      elementType1 = 'Fait';
      elementType2 = 'Fait';
      elementId1 = fait1;
      elementId2 = fait2;
    }
    // Cas 2: Relation entre US de Faits différents
    else if (strati.us_anterieur && strati.us_posterieur) {
      const usAnt = this.w.data().objects.us.all.findByUuid(strati.us_anterieur);
      const usPost = this.w.data().objects.us.all.findByUuid(strati.us_posterieur);

      if (usAnt && usPost && usAnt.item.fait_uuid && usPost.item.fait_uuid &&
        usAnt.item.fait_uuid !== usPost.item.fait_uuid) {
        fait1 = usAnt.item.fait_uuid;
        fait2 = usPost.item.fait_uuid;
        relationType = strati.is_contemporain ? 'contemporain' : 'anterieur';
        elementType1 = 'US';
        elementType2 = 'US';
        elementId1 = strati.us_anterieur;
        elementId2 = strati.us_posterieur;
      }
    }
    // Cas 3: Relation US antérieure -> Fait postérieur
    else if (strati.us_anterieur && strati.fait_posterieur) {
      const usAnt = this.w.data().objects.us.all.findByUuid(strati.us_anterieur);

      if (usAnt && usAnt.item.fait_uuid && usAnt.item.fait_uuid !== strati.fait_posterieur) {
        fait1 = usAnt.item.fait_uuid;
        fait2 = strati.fait_posterieur;
        relationType = strati.is_contemporain ? 'contemporain' : 'anterieur';
        elementType1 = 'US';
        elementType2 = 'Fait';
        elementId1 = strati.us_anterieur;
        elementId2 = fait2;
      }
    }
    // Cas 4: Relation Fait antérieur -> US postérieure
    else if (strati.fait_anterieur && strati.us_posterieur) {
      const usPost = this.w.data().objects.us.all.findByUuid(strati.us_posterieur);

      if (usPost && usPost.item.fait_uuid && usPost.item.fait_uuid !== strati.fait_anterieur) {
        fait1 = strati.fait_anterieur;
        fait2 = usPost.item.fait_uuid;
        relationType = strati.is_contemporain ? 'contemporain' : 'anterieur';
        elementType1 = 'Fait';
        elementType2 = 'US';
        elementId1 = fait1;
        elementId2 = strati.us_posterieur;
      }
    }

    if (!fait1 || !fait2) {
      return null;
    }

    return {
      fait1,
      fait2,
      relationType,
      elementType1,
      elementType2,
      elementId1,
      elementId2
    };
  }

  private checkImplicitFaitUsRelations(strati: ApiStratigraphie, existingRelations: ApiStratigraphie[]): ValidationResult {
    // CAS 1 et 2: Relation entre deux US, dont l'une appartient à un Fait
    if (strati.us_anterieur && strati.us_posterieur && !strati.is_contemporain) {
      const usAnt = this.w.data().objects.us.all.findByUuid(strati.us_anterieur);
      const usPost = this.w.data().objects.us.all.findByUuid(strati.us_posterieur);

      // Cas 1: US antérieure et vérification des relations Fait-US
      if (usAnt && usAnt.item.fait_uuid) {
        const sourceFait = usAnt.item.fait_uuid;

        const conflictingRelations = existingRelations.filter(rel =>
          rel.live && !rel.is_contemporain &&
          rel.us_anterieur === strati.us_posterieur &&
          rel.fait_posterieur === sourceFait
        );

        if (conflictingRelations.length > 0) {
          // Message court amélioré
          const shortMessage = `<strong>${this.getUsTag(strati.us_anterieur)}</strong> ( ${this.getFaitTag(sourceFait)}) est antérieure à <strong>${this.getUsTag(strati.us_posterieur)}</strong> MAIS <strong>${this.getUsTag(strati.us_posterieur)}</strong> est déjà antérieure au <strong>${this.getFaitTag(sourceFait)}</strong>`;

          return {
            result: false,
            message: `Relation stratigraphique incohérente: Vous essayez de définir l'US ${this.getUsTag(strati.us_anterieur)} comme antérieure à l'US ${this.getUsTag(strati.us_posterieur)}, mais il existe déjà une relation où l'US ${this.getUsTag(strati.us_posterieur)} est antérieure au Fait ${this.getFaitTag(sourceFait)} qui contient l'US ${this.getUsTag(strati.us_anterieur)}. Ces deux relations sont contradictoires.`,
            paradoxType: 'consistency',
            conflictingRelations: conflictingRelations,
            shortMessage: shortMessage
          };
        }
      }

      // Cas 1 (inverse): US postérieure et vérification des relations US-Fait
      if (usPost && usPost.item.fait_uuid) {
        const targetFait = usPost.item.fait_uuid;

        const conflictingRelations = existingRelations.filter(rel =>
          rel.live && !rel.is_contemporain &&
          rel.fait_anterieur === targetFait &&
          rel.us_posterieur === strati.us_anterieur
        );

        if (conflictingRelations.length > 0) {
          // Message court amélioré
          const shortMessage = `<strong>${this.getUsTag(strati.us_anterieur)}</strong> est postérieure à <strong>${this.getUsTag(strati.us_posterieur)}</strong> (appartennant ${this.getFaitTag(targetFait)}) MAIS <strong>${this.getFaitTag(targetFait)}</strong> est déjà postérieure à <strong>${this.getUsTag(strati.us_anterieur)}</strong>`;

          return {
            result: false,
            message: `Relation stratigraphique incohérente: Vous essayez de définir l'US ${this.getUsTag(strati.us_anterieur)} comme postérieure à l'US ${this.getUsTag(strati.us_posterieur)}, mais il existe déjà une relation où le Fait ${this.getFaitTag(targetFait)} qui contient l'US ${this.getUsTag(strati.us_posterieur)} est postérieure à l'US ${this.getUsTag(strati.us_anterieur)}. Ces deux relations sont contradictoires.`,
            paradoxType: 'consistency',
            conflictingRelations: conflictingRelations,
            shortMessage: shortMessage
          };
        }
      }
    }

    // CAS SYMÉTRIQUE: Relation entre un Fait et une US
    if (strati.fait_anterieur && strati.us_posterieur && !strati.is_contemporain) {
      const faitUSList = this.getUSListForFait(strati.fait_anterieur);

      for (const usId of faitUSList) {
        const conflictingRelations = existingRelations.filter(rel =>
          rel.live && !rel.is_contemporain &&
          rel.us_anterieur === strati.us_posterieur &&
          rel.us_posterieur === usId
        );

        if (conflictingRelations.length > 0) {
          const usTag = this.getUsTag(usId);
          // Message court amélioré
          const shortMessage = `<strong>${this.getFaitTag(strati.fait_anterieur)}</strong> est postérieure à <strong>${this.getUsTag(strati.us_posterieur)}</strong> MAIS <strong>${this.getUsTag(strati.us_posterieur)}</strong> est déjà postérieure à <strong>${usTag}</strong> (appartenant ${this.getFaitTag(strati.fait_anterieur)})`;

          return {
            result: false,
            message: `Relation stratigraphique incohérente: Vous essayez de définir le Fait ${this.getFaitTag(strati.fait_anterieur)} comme postérieure à l'US ${this.getUsTag(strati.us_posterieur)}, mais il existe déjà une relation où l'US ${this.getUsTag(strati.us_posterieur)} est postérieure à l'US ${usTag} qui appartient à ce Fait. Ces deux relations sont contradictoires.`,
            paradoxType: 'consistency',
            conflictingRelations: conflictingRelations,
            shortMessage: shortMessage
          };
        }
      }
    }

    // CAS SYMÉTRIQUE INVERSE: US antérieure et Fait postérieur
    if (strati.us_anterieur && strati.fait_posterieur && !strati.is_contemporain) {
      const faitUSList = this.getUSListForFait(strati.fait_posterieur);

      for (const usId of faitUSList) {
        const conflictingRelations = existingRelations.filter(rel =>
          rel.live && !rel.is_contemporain &&
          rel.us_anterieur === usId &&
          rel.us_posterieur === strati.us_anterieur
        );

        if (conflictingRelations.length > 0) {
          const usTag = this.getUsTag(usId);
          // Message court amélioré
          const shortMessage = `<strong>${this.getUsTag(strati.us_anterieur)}</strong> est antérieure à <strong>${this.getFaitTag(strati.fait_posterieur)}</strong> MAIS <strong>${usTag}</strong> (appartenant au ${this.getFaitTag(strati.fait_posterieur)}) est déjà antérieure à <strong>${this.getUsTag(strati.us_anterieur)}</strong>`;

          return {
            result: false,
            message: `Relation stratigraphique incohérente: Vous essayez de définir l'US ${this.getUsTag(strati.us_anterieur)} comme antérieure au Fait ${this.getFaitTag(strati.fait_posterieur)}, mais il existe déjà une relation où l'US ${usTag} qui appartient à ce Fait est antérieure à l'US ${this.getUsTag(strati.us_anterieur)}. Ces deux relations sont contradictoires.`,
            paradoxType: 'consistency',
            conflictingRelations: conflictingRelations,
            shortMessage: shortMessage
          };
        }
      }
    }

    return { result: true };
  }

  private buildImplicitRelationErrorMessage(
    strati: ApiStratigraphie,
    usAnt: dbBoundObject<ApiUs>,
    usPost: dbBoundObject<ApiUs>,
    conflictingRelation: ApiStratigraphie,
    relationType: string
  ): string {
    let errorMessage = `Relation stratigraphique incohérente détectée:\n\n`;

    errorMessage += `Vous essayez de définir l'US ${this.getUsTag(strati.us_anterieur)} comme antérieure à l'US ${this.getUsTag(strati.us_posterieur)}.\n\n`;

    if (relationType === 'posterieur') {
      errorMessage += `Cependant, il existe déjà une relation où l'US ${this.getUsTag(strati.us_anterieur)} est antérieure au Fait ${this.getFaitTag(usPost.item.fait_uuid)}.\n`;
      errorMessage += `Puisque l'US ${this.getUsTag(strati.us_posterieur)} appartient au Fait ${this.getFaitTag(usPost.item.fait_uuid)}, elle doit également être postérieure à l'US ${this.getUsTag(strati.us_anterieur)}.\n`;
    } else {
      errorMessage += `Cependant, il existe déjà une relation où le Fait ${this.getFaitTag(usAnt.item.fait_uuid)} est antérieur à l'US ${this.getUsTag(strati.us_posterieur)}.\n`;
      errorMessage += `Puisque l'US ${this.getUsTag(strati.us_anterieur)} appartient au Fait ${this.getFaitTag(usAnt.item.fait_uuid)}, elle doit également être antérieure à l'US ${this.getUsTag(strati.us_posterieur)}.\n`;
    }

    errorMessage += `\nDans une stratigraphie cohérente, toutes les US d'un Fait doivent maintenir les mêmes relations avec les US externes.`;

    return errorMessage;
  }

  /**
   * Identifie les types de relations existantes entre deux Faits
   * @returns Un Set contenant les types de relations ('contemporain', 'anterieur', 'posterieur')
   */
  private identifyExistingRelations(
    fait1: string,
    fait2: string,
    existingRelations: ApiStratigraphie[]
  ): Set<string> {
    const relationTypes = new Set<string>();

    // Filtrer les relations actives impliquant les deux Faits
    const relevantRelations = existingRelations.filter(rel => {
      if (!rel.live) return false;

      // Extraire les Faits impliqués dans cette relation
      const relFait1 = this.getRelationFait1(rel);
      const relFait2 = this.getRelationFait2(rel);

      // Vérifier si cette relation implique nos deux Faits
      return (relFait1 === fait1 && relFait2 === fait2) ||
        (relFait1 === fait2 && relFait2 === fait1);
    });

    // Analyser chaque relation pour déterminer son type par rapport à nos Faits
    relevantRelations.forEach(rel => {
      if (rel.is_contemporain) {
        relationTypes.add('contemporain');
        return;
      }

      const relFait1 = this.getRelationFait1(rel);
      const relFait2 = this.getRelationFait2(rel);

      // Si l'élément antérieur appartient au fait1 et l'élément postérieur au fait2
      if (this.belongsToFait(rel.us_anterieur, rel.fait_anterieur, fait1) &&
        this.belongsToFait(rel.us_posterieur, rel.fait_posterieur, fait2)) {
        relationTypes.add('anterieur');
      }
      // Si l'élément antérieur appartient au fait2 et l'élément postérieur au fait1
      else if (this.belongsToFait(rel.us_anterieur, rel.fait_anterieur, fait2) &&
        this.belongsToFait(rel.us_posterieur, rel.fait_posterieur, fait1)) {
        relationTypes.add('posterieur');
      }
    });

    return relationTypes;
  }

  /**
   * Vérifie si un élément (US ou Fait) appartient à un Fait donné
   */
  private belongsToFait(usUuid: string, faitUuid: string, targetFaitUuid: string): boolean {
    if (faitUuid === targetFaitUuid) {
      return true;
    }

    if (usUuid) {
      const us = this.w.data().objects.us.all.findByUuid(usUuid);
      return us && us.item.fait_uuid === targetFaitUuid;
    }

    return false;
  }

  /**
   * Récupère le premier Fait impliqué dans une relation (soit directement, soit via une US)
   */
  private getRelationFait1(rel: ApiStratigraphie): string {
    if (rel.fait_anterieur) {
      return rel.fait_anterieur;
    }

    if (rel.us_anterieur) {
      const us = this.w.data().objects.us.all.findByUuid(rel.us_anterieur);
      return us ? us.item.fait_uuid : null;
    }

    return null;
  }

  /**
   * Récupère le second Fait impliqué dans une relation (soit directement, soit via une US)
   */
  private getRelationFait2(rel: ApiStratigraphie): string {
    if (rel.fait_posterieur) {
      return rel.fait_posterieur;
    }

    if (rel.us_posterieur) {
      const us = this.w.data().objects.us.all.findByUuid(rel.us_posterieur);
      return us ? us.item.fait_uuid : null;
    }

    return null;
  }

  private buildConflictErrorMessage(
    relation: {
      fait1: string;
      fait2: string;
      relationType: string;
      elementType1: string;
      elementType2: string;
      elementId1: string;
      elementId2: string;
    },
    existingTypes: Set<string>,
    allRelations: ApiStratigraphie[]
  ): ValidationResult {
    // Collecter TOUTES les relations conflictuelles
    const conflictingRelations: ApiStratigraphie[] = [];

    existingTypes.forEach(type => {
      const examples = this.findAllRelationExamples(relation.fait1, relation.fait2, type, allRelations);
      conflictingRelations.push(...examples);
    });

    // Exemples pour le message détaillé
    const conflictExamples = [];

    existingTypes.forEach(type => {
      const example = this.findRelationExample(relation.fait1, relation.fait2, type, allRelations);
      if (example) {
        conflictExamples.push({
          type,
          description: this.formatRelationDescription(example)
        });
      }
    });

    // Construire le message d'erreur détaillé
    let errorMessage = ''
    conflictExamples.forEach((example, index) => {
      errorMessage += `${index + 1}. Relation de type "${example.type}": ${example.description}\n`;
    });

    // Générer le message court pour l'en-tête
    const firstConflict = conflictingRelations[0];
    const shortMessage = this.formatShortConsistencyMessage(relation, firstConflict);

    return {
      result: false,
      message: errorMessage,
      paradoxType: 'consistency',
      conflictingRelations: conflictingRelations,
      shortMessage: shortMessage
    };
  }

  /**
   * Trouve un exemple de relation d'un type donné entre deux Faits
   */
  private findRelationExample(
    fait1: string,
    fait2: string,
    relationType: string,
    relations: ApiStratigraphie[]
  ): ApiStratigraphie {
    return relations.find(rel => {
      if (!rel.live) return false;

      const relFait1 = this.getRelationFait1(rel);
      const relFait2 = this.getRelationFait2(rel);

      if (!relFait1 || !relFait2) return false;

      if (relationType === 'contemporain') {
        return rel.is_contemporain &&
          ((relFait1 === fait1 && relFait2 === fait2) ||
            (relFait1 === fait2 && relFait2 === fait1));
      }
      else if (relationType === 'anterieur') {
        return !rel.is_contemporain &&
          relFait1 === fait1 &&
          relFait2 === fait2;
      }
      else if (relationType === 'posterieur') {
        return !rel.is_contemporain &&
          relFait1 === fait2 &&
          relFait2 === fait1;
      }

      return false;
    });
  }

  /**
   * Formate une description textuelle d'une relation
   */
  private formatRelationDescription(rel: ApiStratigraphie): string {
    let description = '';

    if (rel.us_anterieur) {
      description += `US ${this.getUsTag(rel.us_anterieur)}`;
      if (this.getUSFait(rel.us_anterieur)) {
        description += ` (Fait ${this.getFaitTag(this.getUSFait(rel.us_anterieur))})`;
      }
    } else if (rel.fait_anterieur) {
      description += `Fait ${this.getFaitTag(rel.fait_anterieur)}`;
    }

    description += rel.is_contemporain ? ' est contemporain(e) à ' : ' est antérieur(e) à ';

    if (rel.us_posterieur) {
      description += `US ${this.getUsTag(rel.us_posterieur)}`;
      if (this.getUSFait(rel.us_posterieur)) {
        description += ` (Fait ${this.getFaitTag(this.getUSFait(rel.us_posterieur))})`;
      }
    } else if (rel.fait_posterieur) {
      description += `Fait ${this.getFaitTag(rel.fait_posterieur)}`;
    }

    return description;
  }


  private getUSFait(usUuid: string): string {
    if (!usUuid) {
      return null;
    }
    if (this.usToFaitCache.has(usUuid)) {
      return this.usToFaitCache.get(usUuid);
    }
    const us = this.w.data().objects.us.all.findByUuid(usUuid);
    const faitUuid = us ? us.item.fait_uuid : null;
    this.usToFaitCache.set(usUuid, faitUuid);
    return faitUuid;
  }

  /**
   * Récupère la liste des US appartenant à un Fait
   */
  private getUSListForFait(faitUuid: string): string[] {
    if (!faitUuid) {
      return [];
    }
    if (this.faitToUsCache.has(faitUuid)) {
      return this.faitToUsCache.get(faitUuid);
    }
    const list = this.w.data().objects.us.all.list
      .filter(usObj => usObj.item.fait_uuid === faitUuid && usObj.item.live)
      .map(usObj => usObj.item.us_uuid);
    this.faitToUsCache.set(faitUuid, list);
    return list;
  }

  /**
   * Trouve toutes les relations d'un type donné entre deux Faits
   */
  private findAllRelationExamples(
    fait1: string,
    fait2: string,
    relationType: string,
    relations: ApiStratigraphie[]
  ): ApiStratigraphie[] {
    return relations.filter(rel => {
      if (!rel.live) return false;

      const relFait1 = this.getRelationFait1(rel);
      const relFait2 = this.getRelationFait2(rel);

      if (!relFait1 || !relFait2) return false;

      if (relationType === 'contemporain') {
        return rel.is_contemporain &&
          ((relFait1 === fait1 && relFait2 === fait2) ||
            (relFait1 === fait2 && relFait2 === fait1));
      }
      else if (relationType === 'anterieur') {
        return !rel.is_contemporain &&
          relFait1 === fait1 &&
          relFait2 === fait2;
      }
      else if (relationType === 'posterieur') {
        return !rel.is_contemporain &&
          relFait1 === fait2 &&
          relFait2 === fait1;
      }

      return false;
    });
  }

  /**
   * Formate un message court pour l'en-tête d'un paradoxe de cohérence
   */
  private formatShortConsistencyMessage(
    relation: {
      fait1: string;
      fait2: string;
      relationType: string;
      elementType1: string;
      elementType2: string;
      elementId1: string;
      elementId2: string;
    },
    conflictingRelation: ApiStratigraphie
  ): string {
    // Construire le message court
    let entity1 = relation.elementType1 === 'US'
      ? `US ${this.getUsTag(relation.elementId1)}`
      : `Fait ${this.getFaitTag(relation.elementId1)}`;

    let entity2 = relation.elementType2 === 'US'
      ? `US ${this.getUsTag(relation.elementId2)}`
      : `Fait ${this.getFaitTag(relation.elementId2)}`;

    let relationType = relation.relationType === 'contemporain' ? 'contemporain à' : 'antérieur à';

    // Récupérer les éléments de la relation conflictuelle
    let conflictEntity1 = '';
    let conflictEntity2 = '';
    let conflictRelationType = '';

    if (conflictingRelation.us_anterieur) {
      conflictEntity1 = `US ${this.getUsTag(conflictingRelation.us_anterieur)}`;
    } else if (conflictingRelation.fait_anterieur) {
      conflictEntity1 = `Fait ${this.getFaitTag(conflictingRelation.fait_anterieur)}`;
    }

    if (conflictingRelation.us_posterieur) {
      conflictEntity2 = `US ${this.getUsTag(conflictingRelation.us_posterieur)}`;
    } else if (conflictingRelation.fait_posterieur) {
      conflictEntity2 = `Fait ${this.getFaitTag(conflictingRelation.fait_posterieur)}`;
    }

    conflictRelationType = conflictingRelation.is_contemporain ? 'contemporain à' : 'antérieur à';

    return `${entity1} ${relationType} <strong>${entity2}</strong> mais ${conflictEntity1} ${conflictRelationType} ${conflictEntity2}`;
  }

  public findAllParadoxes(paradoxType?: 'containment' | 'consistency' | 'temporal' | 'cycle'): DetectedParadox[] {
    this.ensureCacheIsReady();
    const startTime = performance.now();

    const relations = this.liveRelations.filter(rel => rel?.live !== false);
    const relationLookup = this.buildRelationLookup(relations);

    const paradoxes: DetectedParadox[] = [];
    const uniqueCycles = new Map<string, CycleParadox>();
    const relationInCycle = new Map<string, string>();
    const validators = this.buildValidatorDescriptors(paradoxType, relations);

    for (const relation of relations) {
      const relationId = this.getRelationId(relation);
      if (relationInCycle.has(relationId)) {
        continue;
      }

      for (const validator of validators) {
        const result = validator.fn(relation);

        if (!result.result) {
          if (validator.type === 'cycle' && result.cycleInfo) {
            const cycleId = result.cycleInfo.cycleId;

            if (!uniqueCycles.has(cycleId)) {
              const cycleRelations = this.findRelationsInCycle(
                result.cycleInfo.cycleNodesUUIDs,
                relationLookup
              );

              const cycleParadox: CycleParadox = {
                type: 'cycle',
                message: result.message,
                relations: [relation],
                cycleId: cycleId,
                cycleNodes: result.cycleInfo.cycleNodes,
                allRelations: cycleRelations,
                cycleNodesUUIDs : result.cycleInfo.cycleNodesUUIDs
              };

              uniqueCycles.set(cycleId, cycleParadox);

              cycleRelations.forEach(rel => {
                relationInCycle.set(this.getRelationId(rel), cycleId);
              });
            }
            break;
          } else {
            const relationsToInclude = result.conflictingRelations
              ? [relation, ...result.conflictingRelations]
              : [relation];

            paradoxes.push({
              type: validator.type,
              message: result.message || `Paradoxe de type ${validator.type} détecté`,
              relations: relationsToInclude,
              shortMessage: result.shortMessage,
              debugInfo: {
                conflictingRelationsCount: result.conflictingRelations?.length || 0
              }
            });
            break;
          }
        }
      }
    }

    uniqueCycles.forEach(cycle => paradoxes.push(cycle));

    const totalTime = performance.now() - startTime;
    LOG.debug.log(
      {...CONTEXT, action: 'findAllParadoxes'},
      `Completed in ${totalTime.toFixed(2)}ms`,
      {count: paradoxes.length, filter: paradoxType ?? 'all'}
    );

    return paradoxes;
  }

  private buildValidatorDescriptors(
    paradoxType: 'containment' | 'consistency' | 'temporal' | 'cycle' | null | undefined,
    relations: ApiStratigraphie[]
  ): Array<{type: 'containment' | 'consistency' | 'temporal' | 'cycle'; fn: (relation: ApiStratigraphie) => ValidationResult}> {
    const descriptors: Array<{type: 'containment' | 'consistency' | 'temporal' | 'cycle'; fn: (relation: ApiStratigraphie) => ValidationResult}> = [];

    if (!paradoxType || paradoxType === 'containment') {
      descriptors.push({
        type: 'containment',
        fn: (relation) => this.checkFaitUSContainmentContradiction(relation, relations)
      });
    }

    if (!paradoxType || paradoxType === 'consistency') {
      descriptors.push({
        type: 'consistency',
        fn: (relation) => this.checkFaitRelationConsistency(relation, relations)
      });
    }

    if (!paradoxType || paradoxType === 'temporal') {
      descriptors.push({
        type: 'temporal',
        fn: (relation) => this.checkAnteriorPosteriorContradiction(relation, relations)
      });
    }

    if (!paradoxType || paradoxType === 'cycle') {
      descriptors.push({
        type: 'cycle',
        fn: (relation) => this.checkCycleContradiction(relation, relations)
      });
    }

    return descriptors;
  }

  private getRelationId(rel: ApiStratigraphie): string {
    return `${rel.stratigraphie_uuid || 'new'}-${rel.us_anterieur || ''}-${rel.us_posterieur || ''}-${rel.fait_anterieur || ''}-${rel.fait_posterieur || ''}`;
  }

  // Méthode pour trouver toutes les relations impliquées dans un cycle
  private findRelationsInCycle(
    cycleNodesUUIDs: string[],
    relationLookup: Map<string, ApiStratigraphie[]>
  ): ApiStratigraphie[] {
    const cycleRelations: ApiStratigraphie[] = [];

    for (let i = 0; i < cycleNodesUUIDs.length; i++) {
      const currentUUID = cycleNodesUUIDs[i];
      const nextUUID = cycleNodesUUIDs[(i + 1) % cycleNodesUUIDs.length];
      const key = this.buildRelationLookupKey(currentUUID, nextUUID);
      const matches = relationLookup.get(key);
      if (matches) {
        matches.forEach(rel => {
          if (!cycleRelations.includes(rel)) {
            cycleRelations.push(rel);
          }
        });
      }
    }
    return cycleRelations;
  }

  private buildRelationLookup(relations: ApiStratigraphie[]): Map<string, ApiStratigraphie[]> {
    const lookup = new Map<string, ApiStratigraphie[]>();
    const add = (from: string, to: string, relation: ApiStratigraphie) => {
      if (!from || !to) {
        return;
      }
      const key = this.buildRelationLookupKey(from, to);
      if (!lookup.has(key)) {
        lookup.set(key, []);
      }
      lookup.get(key).push(relation);
    };

    relations.forEach(relation => {
      if (!relation || relation.live === false) {
        return;
      }
      if (!relation.is_contemporain) {
        if (relation.us_posterieur && relation.us_anterieur) {
          add(relation.us_posterieur, relation.us_anterieur, relation);
        }
        if (relation.fait_posterieur && relation.fait_anterieur) {
          add(relation.fait_posterieur, relation.fait_anterieur, relation);
        }
        if (relation.us_posterieur && relation.fait_anterieur) {
          add(relation.us_posterieur, relation.fait_anterieur, relation);
        }
        if (relation.fait_posterieur && relation.us_anterieur) {
          add(relation.fait_posterieur, relation.us_anterieur, relation);
        }
      }
    });

    return lookup;
  }

  private buildRelationLookupKey(from: string, to: string): string {
    return `${from}|${to}`;
  }

}
