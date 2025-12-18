import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { CastorValidationService, CycleParadox, DetectedParadox } from './castor-validation.service';
import { ApiStratigraphie } from '../../../shared';

export interface CycleHighlightInfo {
  cycleId: string;
  cycleNodes: string[];           // Tags lisibles (ex: "US001", "F002")
  cycleNodesUUIDs: string[];      // UUIDs bruts
  allRelations: ApiStratigraphie[]; // Relations impliquées dans le cycle
  message: string;
  cycleLength: number;
}

export interface ParadoxNavigationState {
  currentIndex: number;
  totalCycles: number;
  currentCycle: CycleHighlightInfo | null;
  selectedCycleIds: Set<string>;  // Pour la sélection multiple
}

export interface EdgeIdentifier {
  sourceUuid: string;
  targetUuid: string;
  sourceSanitizedId: string;
  targetSanitizedId: string;
}

@Injectable({
  providedIn:  'root'
})
export class DiagramParadoxModeService {

  // État du mode paradoxe
  private _isParadoxMode = new BehaviorSubject<boolean>(false);
  public isParadoxMode$ = this._isParadoxMode.asObservable();

  // Liste des cycles détectés
  private _detectedCycles = new BehaviorSubject<CycleHighlightInfo[]>([]);
  public detectedCycles$ = this._detectedCycles.asObservable();

  // État de navigation
  private _navigationState = new BehaviorSubject<ParadoxNavigationState>({
    currentIndex: -1,
    totalCycles:  0,
    currentCycle: null,
    selectedCycleIds: new Set()
  });
  public navigationState$ = this._navigationState.asObservable();

  // Événement quand un cycle est sélectionné
  private _cycleSelected = new Subject<CycleHighlightInfo>();
  public cycleSelected$ = this._cycleSelected.asObservable();

  // Référence au conteneur SVG
  private containerElement: HTMLElement | null = null;

  // Cache pour la recherche rapide des éléments SVG
  private edgeElementsCache = new Map<string, Element>();
  private nodeElementsCache = new Map<string, Element>();

  constructor(
    private validationService: CastorValidationService,
    private ngZone: NgZone
  ) {}

  /**
   * Initialise le service avec le conteneur du diagramme
   */
  initialize(container: HTMLElement): void {
    this.containerElement = container;
    console.log('[DiagramParadoxMode] Initialized');
  }

  /**
   * Reconstruit les caches des éléments SVG
   * À appeler après chaque re-rendu du diagramme
   */
  refreshCaches(): void {
    this.buildElementCaches();
  }

  /**
   * Active/désactive le mode paradoxe
   */
  setParadoxMode(enabled: boolean): void {
    this._isParadoxMode.next(enabled);

    if (this.containerElement) {
      if (enabled) {
        this.enableParadoxMode();
      } else {
        this.disableParadoxMode();
      }
    }

    console.log(`[DiagramParadoxMode] Paradox mode:  ${enabled}`);
  }

  /**
   * Toggle le mode paradoxe
   */
  toggleParadoxMode(): boolean {
    const newState = !this._isParadoxMode.value;
    this. setParadoxMode(newState);
    return newState;
  }

  /**
   * Active le mode paradoxe et détecte les cycles
   */
  private enableParadoxMode(): void {
    if (!this.containerElement) return;

    this.containerElement.classList.add('diagram-paradox-mode');
    this. buildElementCaches();
    this.detectAllCycles();
  }

  /**
   * Désactive le mode paradoxe
   */
  private disableParadoxMode(): void {
    if (!this.containerElement) return;

    this.containerElement. classList.remove('diagram-paradox-mode');
    this.clearAllHighlights();

    // Reset navigation state
    this._navigationState. next({
      currentIndex: -1,
      totalCycles:  0,
      currentCycle: null,
      selectedCycleIds: new Set()
    });
    this._detectedCycles.next([]);
  }

  /**
   * Détecte tous les cycles via le service de validation
   */
  detectAllCycles(): void {
    const paradoxes = this.validationService.findAllParadoxes('cycle');

    const cycles:  CycleHighlightInfo[] = paradoxes
      .filter((p): p is CycleParadox => p. type === 'cycle' && 'cycleNodesUUIDs' in p)
      .map(cycle => ({
        cycleId: cycle. cycleId,
        cycleNodes: cycle.cycleNodes,
        cycleNodesUUIDs: cycle.cycleNodesUUIDs || [],
        allRelations: cycle.allRelations || [],
        message: cycle.message,
        cycleLength: cycle.cycleNodesUUIDs?.length || 0
      }));

    this._detectedCycles.next(cycles);

    // Mettre à jour l'état de navigation
    const navState:  ParadoxNavigationState = {
      currentIndex: cycles.length > 0 ? 0 :  -1,
      totalCycles: cycles.length,
      currentCycle: cycles. length > 0 ? cycles[0] : null,
      selectedCycleIds: new Set(cycles.length > 0 ? [cycles[0].cycleId] : [])
    };
    this._navigationState.next(navState);

    // Highlight le premier cycle si disponible
    if (cycles.length > 0) {
      this.highlightCycle(cycles[0]);
    }

    console.log(`[DiagramParadoxMode] Detected ${cycles.length} cycles`);
  }

  /**
   * Sélectionne un cycle par son index (sélection simple)
   */
  selectCycleByIndex(index: number): void {
    const cycles = this._detectedCycles. value;

    if (index < 0 || index >= cycles. length) {
      console.warn(`[DiagramParadoxMode] Invalid cycle index: ${index}`);
      return;
    }

    const cycle = cycles[index];

    this._navigationState.next({
      currentIndex: index,
      totalCycles: cycles.length,
      currentCycle: cycle,
      selectedCycleIds: new Set([cycle.cycleId])
    });

    this.highlightCycle(cycle);

    this. ngZone.run(() => {
      this._cycleSelected.next(cycle);
    });
  }

  /**
   * Sélectionne un cycle par son ID
   */
  selectCycleById(cycleId: string): void {
    const cycles = this._detectedCycles.value;
    const index = cycles.findIndex(c => c.cycleId === cycleId);

    if (index !== -1) {
      this.selectCycleByIndex(index);
    }
  }

  /**
   * Toggle la sélection d'un cycle (pour sélection multiple)
   */
  toggleCycleSelection(cycleId: string): void {
    const navState = this._navigationState.value;
    const selectedIds = new Set(navState.selectedCycleIds);

    if (selectedIds.has(cycleId)) {
      selectedIds.delete(cycleId);
    } else {
      selectedIds.add(cycleId);
    }

    const cycles = this._detectedCycles. value;
    const selectedCycles = cycles.filter(c => selectedIds.has(c. cycleId));

    this._navigationState.next({
      ... navState,
      selectedCycleIds: selectedIds,
      currentCycle:  selectedCycles. length > 0 ? selectedCycles[0] : null
    });

    // Highlight tous les cycles sélectionnés
    this.highlightMultipleCycles(selectedCycles);
  }

  /**
   * Sélectionne tous les cycles
   */
  selectAllCycles(): void {
    const cycles = this._detectedCycles.value;
    const allIds = new Set(cycles.map(c => c.cycleId));

    this._navigationState.next({
      ...this._navigationState.value,
      selectedCycleIds: allIds
    });

    this.highlightMultipleCycles(cycles);
  }

  /**
   * Désélectionne tous les cycles
   */
  deselectAllCycles(): void {
    this._navigationState.next({
      ...this._navigationState.value,
      selectedCycleIds:  new Set(),
      currentCycle: null
    });

    this.clearAllHighlights();
  }

  /**
   * Navigation:  cycle suivant
   */
  nextCycle(): void {
    const navState = this._navigationState.value;
    if (navState.totalCycles === 0) return;

    const nextIndex = (navState.currentIndex + 1) % navState.totalCycles;
    this. selectCycleByIndex(nextIndex);
  }

  /**
   * Navigation: cycle précédent
   */
  previousCycle(): void {
    const navState = this._navigationState. value;
    if (navState.totalCycles === 0) return;

    const prevIndex = navState.currentIndex === 0
      ? navState.totalCycles - 1
      : navState.currentIndex - 1;
    this.selectCycleByIndex(prevIndex);
  }

  /**
   * Met en surbrillance un cycle complet (PRIORITÉ AUX ARÊTES)
   */
  highlightCycle(cycle: CycleHighlightInfo): void {
    this.clearAllHighlights();

    if (! this.containerElement) return;

    // 1. PRIORITÉ:  Highlight les arêtes du cycle
    this.highlightCycleEdges(cycle);

    // 2. SECONDAIRE: Highlight les nœuds (style atténué)
    cycle.cycleNodesUUIDs.forEach(uuid => {
      this.highlightNode(uuid, 'secondary');
    });

    // 3. Centrer la vue sur le premier nœud
    this.centerViewOnCycle(cycle);
  }

  /**
   * Met en surbrillance plusieurs cycles
   */
  highlightMultipleCycles(cycles: CycleHighlightInfo[]): void {
    this.clearAllHighlights();

    if (!this.containerElement || cycles.length === 0) return;

    cycles.forEach((cycle, index) => {
      // Utiliser une couleur différente pour chaque cycle (optionnel)
      const colorClass = `cycle-color-${index % 5}`;

      this.highlightCycleEdges(cycle, colorClass);

      cycle.cycleNodesUUIDs.forEach(uuid => {
        this.highlightNode(uuid, 'secondary', colorClass);
      });
    });
  }

  /**
   * MÉTHODE PRINCIPALE: Met en surbrillance les arêtes d'un cycle
   * Stratégie: reconstruire les paires source→target à partir de cycleNodesUUIDs
   */
  private highlightCycleEdges(cycle: CycleHighlightInfo, additionalClass?: string): void {
    const cycleUUIDs = cycle.cycleNodesUUIDs;

    if (cycleUUIDs.length < 2) {
      console.warn('[DiagramParadoxMode] Cycle has less than 2 nodes');
      return;
    }

    console.group(`[DiagramParadoxMode] Highlighting edges for cycle: ${cycle.cycleId}`);
    console.log('Cycle nodes:', cycleUUIDs);

    let edgesHighlighted = 0;

    // Parcourir les paires consécutives (incluant le retour au premier nœud)
    for (let i = 0; i < cycleUUIDs.length; i++) {
      const sourceUuid = cycleUUIDs[i];
      const targetUuid = cycleUUIDs[(i + 1) % cycleUUIDs.length];

      const highlighted = this.highlightEdgeBetweenNodes(sourceUuid, targetUuid, additionalClass);

      if (highlighted) {
        edgesHighlighted++;
        console.log(`  ✓ Edge highlighted: ${sourceUuid. substring(0, 8)} → ${targetUuid.substring(0, 8)}`);
      } else {
        // Essayer dans l'autre sens (graph peut être dirigé différemment)
        const reverseHighlighted = this.highlightEdgeBetweenNodes(targetUuid, sourceUuid, additionalClass);
        if (reverseHighlighted) {
          edgesHighlighted++;
          console.log(`  ✓ Edge highlighted (reverse): ${targetUuid.substring(0, 8)} → ${sourceUuid.substring(0, 8)}`);
        } else {
          console.warn(`  ✗ Edge NOT found: ${sourceUuid.substring(0, 8)} ↔ ${targetUuid. substring(0, 8)}`);
        }
      }
    }

    console.log(`Total edges highlighted: ${edgesHighlighted}/${cycleUUIDs.length}`);
    console.groupEnd();
  }

  /**
   * Met en surbrillance l'arête entre deux nœuds spécifiques
   * Utilise les classes CSS LS-node_xxx et LE-node_xxx de Mermaid
   */
  private highlightEdgeBetweenNodes(
    sourceUuid: string,
    targetUuid: string,
    additionalClass?: string
  ): boolean {
    const sourceSanitized = this.sanitizeId(sourceUuid);
    const targetSanitized = this. sanitizeId(targetUuid);

    const edgeElement = this.findEdgeElement(sourceSanitized, targetSanitized);

    if (edgeElement) {
      edgeElement.classList.add('paradox-edge-highlighted');
      if (additionalClass) {
        edgeElement.classList.add(additionalClass);
      }
      return true;
    }

    return false;
  }

  /**
   * Trouve l'élément SVG d'une arête par source et target
   */
  private findEdgeElement(sourceSanitizedId: string, targetSanitizedId: string): Element | null {
    const cacheKey = `${sourceSanitizedId}|${targetSanitizedId}`;
    if (this.edgeElementsCache.has(cacheKey)) {
      return this.edgeElementsCache.get(cacheKey) || null;
    }

    if (!this.containerElement) return null;

    const svg = this. containerElement.querySelector('svg');
    if (!svg) return null;

    // CORRECTION: Array.from() pour itérer
    const paths = Array.from(svg.querySelectorAll('path.flowchart-link'));

    for (const path of paths) {
      const classes = path.getAttribute('class') || '';

      if (classes.includes(`LS-${sourceSanitizedId}`) &&
          classes.includes(`LE-${targetSanitizedId}`)) {
        this.edgeElementsCache.set(cacheKey, path);
        return path;
      }
    }

    return null;
  }

  /**
   * Met en surbrillance un nœud (style secondaire par défaut)
   */
  private highlightNode(uuid: string, priority: 'primary' | 'secondary' = 'secondary', additionalClass?: string): void {
    const sanitizedId = this.sanitizeId(uuid);
    const nodeElement = this.findNodeElement(sanitizedId);

    if (nodeElement) {
      const className = priority === 'primary'
        ? 'paradox-node-highlighted-primary'
        : 'paradox-node-highlighted';

      nodeElement.classList.add(className);

      if (additionalClass) {
        nodeElement.classList.add(additionalClass);
      }
    }
  }

  /**
   * Trouve un élément nœud par son ID sanitisé
   */
  private findNodeElement(sanitizedId:  string): Element | null {
    // 1. Chercher dans le cache
    if (this.nodeElementsCache. has(sanitizedId)) {
      return this.nodeElementsCache.get(sanitizedId) || null;
    }

    // 2. Fallback: recherche directe
    if (!this.containerElement) return null;

    const svg = this.containerElement.querySelector('svg');
    if (!svg) return null;

    // Recherche par data-id (format Mermaid)
    let node = svg.querySelector(`[data-id="${sanitizedId}"]`);
    if (node) {
      this.nodeElementsCache.set(sanitizedId, node);
      return node;
    }

    // Recherche par id contenant le sanitizedId
    node = svg.querySelector(`g[id*="${sanitizedId}"]`);
    if (node) {
      this.nodeElementsCache. set(sanitizedId, node);
      return node;
    }

    return null;
  }

  /**
   * Centre la vue sur le cycle actuel
   */
  private centerViewOnCycle(cycle:  CycleHighlightInfo): void {
    if (!this. containerElement || cycle.cycleNodesUUIDs.length === 0) return;

    const firstNodeUuid = cycle.cycleNodesUUIDs[0];
    const sanitizedId = this.sanitizeId(firstNodeUuid);
    const nodeElement = this.findNodeElement(sanitizedId);

    if (nodeElement) {
      nodeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }

  /**
   * Efface toutes les surbrillances
   */
  clearAllHighlights(): void {
    if (! this.containerElement) return;

    const classesToRemove = [
      'paradox-edge-highlighted',
      'paradox-node-highlighted',
      'paradox-node-highlighted-primary',
      'cycle-color-0', 'cycle-color-1', 'cycle-color-2', 'cycle-color-3', 'cycle-color-4'
    ];

    classesToRemove.forEach(className => {
      // CORRECTION: Array.from() pour itérer
      const elements = Array.from(this.containerElement! .querySelectorAll(`.${className}`));
      elements.forEach(el => el.classList.remove(className));
    });
  }

  /**
   * Construit les caches pour une recherche rapide des éléments SVG
   */
  private buildElementCaches(): void {
    this.nodeElementsCache. clear();
    this.edgeElementsCache.clear();

    if (!this.containerElement) return;

    const svg = this.containerElement.querySelector('svg');
    if (!svg) return;

    // CORRECTION: Utiliser Array.from() pour les NodeList
    // Cache des nœuds
    const nodes = Array.from(svg.querySelectorAll('[data-id^="node_"], g[id*="node_"]'));
    nodes.forEach(node => {
      const dataId = node.getAttribute('data-id');
      const id = node.getAttribute('id');

      if (dataId && dataId.startsWith('node_')) {
        this.nodeElementsCache.set(dataId, node);
      } else if (id) {
        const match = id.match(/(node_[a-f0-9_]+)/i);
        if (match) {
          this.nodeElementsCache.set(match[1], node);
        }
      }
    });

    // Cache des arêtes
    const edges = Array.from(svg.querySelectorAll('path.flowchart-link'));
    edges.forEach(edge => {
      const classes = edge.getAttribute('class') || '';
      const sourceMatch = classes.match(/LS-(node_[a-f0-9_]+)/i);
      const targetMatch = classes.match(/LE-(node_[a-f0-9_]+)/i);

      if (sourceMatch && targetMatch) {
        const key = `${sourceMatch[1]}|${targetMatch[1]}`;
        this.edgeElementsCache.set(key, edge);
      }
    });

    console.log(`[DiagramParadoxMode] Cached ${this.nodeElementsCache.size} nodes and ${this.edgeElementsCache.size} edges`);
  }

  /**
   * Convertit un UUID en ID sanitisé (format Mermaid)
   */
  private sanitizeId(uuid: string): string {
    return 'node_' + uuid.replace(/-/g, '_');
  }

  /**
   * Récupère l'état actuel de navigation
   */
  get currentNavigationState(): ParadoxNavigationState {
    return this._navigationState.value;
  }

  /**
   * Récupère tous les cycles détectés
   */
  get allDetectedCycles(): CycleHighlightInfo[] {
    return this._detectedCycles.value;
  }

  /**
   * Vérifie si le mode paradoxe est actif
   */
  get isActive(): boolean {
    return this._isParadoxMode.value;
  }

  /**
   * Vérifie si un cycle spécifique est sélectionné
   */
  isCycleSelected(cycleId: string): boolean {
    return this._navigationState.value.selectedCycleIds.has(cycleId);
  }

  /**
   * Nettoie le service
   */
  destroy(): void {
    this.disableParadoxMode();
    this.containerElement = null;
    this. nodeElementsCache.clear();
    this.edgeElementsCache. clear();
  }

  /**
   * Debug: affiche tous les cycles et arêtes détectés
   */
  debugAllCycles(): void {
    const cycles = this._detectedCycles.value;

    console.group(`[DiagramParadoxMode] All Cycles (${cycles.length})`);
    cycles.forEach((cycle, index) => {
      console.group(`Cycle ${index + 1}: ${cycle.cycleId}`);
      console.log('Nodes:', cycle.cycleNodes);
      console.log('UUIDs:', cycle.cycleNodesUUIDs);
      console.log('Relations:', cycle.allRelations. length);
      console.log('Message:', cycle.message);
      console.groupEnd();
    });
    console.groupEnd();
  }

  /**
   * Debug: liste toutes les arêtes présentes dans le SVG
   */
  debugAllEdges(): void {
    if (!this.containerElement) return;

    const svg = this. containerElement.querySelector('svg');
    if (!svg) return;

    // CORRECTION: Array.from()
    const edges = Array.from(svg.querySelectorAll('path.flowchart-link'));

    console.group(`[DiagramParadoxMode] All SVG Edges (${edges.length})`);
    edges.forEach((edge, index) => {
      const classes = edge.getAttribute('class') || '';
      const sourceMatch = classes.match(/LS-(node_[a-f0-9_]+)/i);
      const targetMatch = classes.match(/LE-(node_[a-f0-9_]+)/i);

      console.log(`Edge ${index}:`, {
        source: sourceMatch?.[1] || 'N/A',
        target: targetMatch?.[1] || 'N/A',
        classes: classes
      });
    });
    console.groupEnd();
  }
}