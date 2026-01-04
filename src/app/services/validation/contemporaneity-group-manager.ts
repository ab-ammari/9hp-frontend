import { DisjointSet } from './disjoint-set';
import { QuotientGraphManager, MergeSimulationResult, PathResult } from './quotient-graph-manager';

/**
 * Information sur une entité (US ou Fait)
 */
export interface EntityInfo {
  uuid: string;
  type: 'US' | 'FAIT';
  tag?: string;
  /** Pour les US : UUID du Fait parent */
  faitUuid?: string;
}

/**
 * Représente une relation stratigraphique
 */
export interface StratigraphicRelation {
  uuid: string;
  /** Entité antérieure (plus ancienne) */
  anterieur: EntityInfo | null;
  /** Entité postérieure (plus récente) */
  posterieur: EntityInfo | null;
  /** Est-ce une relation de contemporanéité ? */
  isContemporain: boolean;
  /** La relation est-elle active ? */
  live: boolean;
}

/**
 * Résultat de validation d'une relation temporelle
 */
export interface TemporalValidationResult {
  valid: boolean;
  errorType?: 'SAME_GROUP' | 'CYCLE' | 'CONTAINMENT';
  message?: string;
  /** Détails du cycle si détecté */
  cycleInfo?: {
    path: string[];
    pathTags: string[];
    relations: string[];
  };
  /** Groupes impliqués pour debug */
  debugInfo?: {
    sourceGroup: string;
    targetGroup: string;
    sourceGroupMembers: string[];
    targetGroupMembers: string[];
  };
}

/**
 * Résultat de validation d'une relation de contemporanéité
 */
export interface ContemporaneityValidationResult {
  valid: boolean;
  errorType?: 'EXISTING_TEMPORAL_PATH' | 'WOULD_CREATE_CYCLE' | 'CONTAINMENT';
  message?: string;
  /** Chemin temporel existant qui empêche la contemporanéité */
  existingPath?: {
    path: string[];
    pathTags: string[];
  };
  /** Groupes qui seraient en conflit après fusion */
  conflictingGroups?: string[];
}

/**
 * ContemporaneityGroupManager - Gestionnaire principal des groupes de contemporanéité
 * 
 * Cette classe orchestre :
 * - DisjointSet : pour les groupes de contemporanéité (qui est contemporain de qui)
 * - QuotientGraph : pour les relations temporelles entre groupes
 * 
 * Elle fournit une API de haut niveau pour :
 * - Valider les nouvelles relations (temporelles ou de contemporanéité)
 * - Maintenir la cohérence des structures lors des ajouts/suppressions
 * - Détecter les paradoxes complexes (cycles indirects, conflits de fusion)
 */
export class ContemporaneityGroupManager {
  /**
   * Structure Union-Find pour les groupes de contemporanéité
   */
  private groups = new DisjointSet<string>();
  
  /**
   * Graphe quotient pour les relations temporelles entre groupes
   */
  private quotientGraph = new QuotientGraphManager();
  
  /**
   * Index des entités avec leurs informations
   */
  private entities = new Map<string, EntityInfo>();
  
  /**
   * Index des relations par UUID
   */
  private relations = new Map<string, StratigraphicRelation>();
  
  /**
   * Callback pour obtenir le tag d'une entité (pour les messages d'erreur)
   */
  private getTagCallback: ((uuid: string) => string) | null = null;

  /**
   * Configure le callback pour récupérer les tags des entités
   */
  setTagCallback(callback: (uuid: string) => string): void {
    this.getTagCallback = callback;
  }

  /**
   * Retourne le tag d'une entité ou son UUID si pas de callback
   */
  private getTag(uuid: string): string {
    if (this.getTagCallback) {
      return this.getTagCallback(uuid);
    }
    return uuid.substring(0, 8);
  }

  /**
   * Enregistre une entité dans le système
   */
  registerEntity(info: EntityInfo): void {
    this.entities.set(info.uuid, info);
    this.groups.makeSet(info.uuid);
    // Ajouter le groupe au graphe quotient
    this.quotientGraph.addNode(this.groups.find(info.uuid)!);
  }

  /**
   * Trouve le groupe (représentant) d'une entité
   */
  findGroup(entityUuid: string): string | null {
    return this.groups.find(entityUuid);
  }

  /**
   * Vérifie si deux entités sont dans le même groupe de contemporanéité
   */
  areContemporary(entity1: string, entity2: string): boolean {
    return this.groups.connected(entity1, entity2);
  }

  /**
   * Retourne tous les membres du groupe d'une entité
   */
  getGroupMembers(entityUuid: string): string[] {
    return Array.from(this.groups.getGroupMembers(entityUuid));
  }

  /**
   * Retourne tous les groupes avec leurs membres
   */
  getAllGroups(): Map<string, string[]> {
    const result = new Map<string, string[]>();
    this.groups.getAllGroups().forEach((members, root) => {
      result.set(root, Array.from(members));
    });
    return result;
  }

  // ============================================================
  // VALIDATION DES RELATIONS TEMPORELLES
  // ============================================================

  /**
   * Valide une nouvelle relation temporelle (non-contemporaine)
   * 
   * Vérifie :
   * 1. Les deux entités ne sont pas dans le même groupe (sinon paradoxe)
   * 2. L'ajout ne crée pas de cycle dans le graphe quotient
   * 3. Pas de relation de contenance interdite (US dans son propre Fait)
   */
  validateTemporalRelation(
    anterieurUuid: string,
    posterieurUuid: string
  ): TemporalValidationResult {
    // Vérifier que les entités existent
    if (!this.groups.has(anterieurUuid)) {
      this.groups.makeSet(anterieurUuid);
    }
    if (!this.groups.has(posterieurUuid)) {
      this.groups.makeSet(posterieurUuid);
    }
    
    const groupAnt = this.groups.find(anterieurUuid)!;
    const groupPost = this.groups.find(posterieurUuid)!;
    
    // ============================================================
    // VÉRIFICATION 1 : Même groupe (Paradoxe A)
    // ============================================================
    if (groupAnt === groupPost) {
      const members = this.getGroupMembers(anterieurUuid);
      return {
        valid: false,
        errorType: 'SAME_GROUP',
        message: this.buildSameGroupErrorMessage(anterieurUuid, posterieurUuid, members),
        debugInfo: {
          sourceGroup: groupPost,
          targetGroup: groupAnt,
          sourceGroupMembers: members,
          targetGroupMembers: members
        }
      };
    }
    
    // ============================================================
    // VÉRIFICATION 2 : Cycle (Paradoxe B)
    // Une relation temporelle va de postérieur → antérieur
    // Un cycle existerait si antérieur peut déjà atteindre postérieur
    // ============================================================
    const cycleCheck = this.quotientGraph.wouldCreateCycle(groupPost, groupAnt);
    
    if (cycleCheck) {
      return {
        valid: false,
        errorType: 'CYCLE',
        message: this.buildCycleErrorMessage(cycleCheck.path),
        cycleInfo: {
          path: cycleCheck.path,
          pathTags: cycleCheck.path.map(g => this.getRepresentativeTag(g)),
          relations: cycleCheck.relations
        },
        debugInfo: {
          sourceGroup: groupPost,
          targetGroup: groupAnt,
          sourceGroupMembers: this.getGroupMembers(posterieurUuid),
          targetGroupMembers: this.getGroupMembers(anterieurUuid)
        }
      };
    }
    
    return { valid: true };
  }

  /**
   * Ajoute une relation temporelle validée
   */
  addTemporalRelation(relation: StratigraphicRelation): void {
    if (relation.isContemporain || !relation.live) return;
    if (!relation.anterieur || !relation.posterieur) return;
    
    const anterieurUuid = relation.anterieur.uuid;
    const posterieurUuid = relation.posterieur.uuid;
    
    // S'assurer que les entités sont enregistrées
    if (!this.groups.has(anterieurUuid)) {
      this.registerEntity(relation.anterieur);
    }
    if (!this.groups.has(posterieurUuid)) {
      this.registerEntity(relation.posterieur);
    }
    
    const groupAnt = this.groups.find(anterieurUuid)!;
    const groupPost = this.groups.find(posterieurUuid)!;
    
    // Ajouter l'arête dans le graphe quotient
    this.quotientGraph.addEdge(groupPost, groupAnt, relation.uuid);
    
    // Stocker la relation
    this.relations.set(relation.uuid, relation);
  }

  // ============================================================
  // VALIDATION DES RELATIONS DE CONTEMPORANÉITÉ
  // ============================================================

  /**
   * Valide une nouvelle relation de contemporanéité
   * 
   * Vérifie :
   * 1. Il n'existe pas de chemin temporel direct entre les deux groupes
   * 2. La fusion des groupes ne créerait pas de conflit (paradoxe C étendu)
   * 3. Pas de relation de contenance interdite
   */
  validateContemporaneityRelation(
    entity1Uuid: string,
    entity2Uuid: string
  ): ContemporaneityValidationResult {
    // S'assurer que les entités existent
    if (!this.groups.has(entity1Uuid)) {
      this.groups.makeSet(entity1Uuid);
    }
    if (!this.groups.has(entity2Uuid)) {
      this.groups.makeSet(entity2Uuid);
    }
    
    const group1 = this.groups.find(entity1Uuid)!;
    const group2 = this.groups.find(entity2Uuid)!;
    
    // Déjà dans le même groupe : relation redondante mais valide
    if (group1 === group2) {
      return { valid: true };
    }
    
    // ============================================================
    // VÉRIFICATION : Simulation de fusion (Paradoxe C)
    // ============================================================
    const mergeResult = this.quotientGraph.simulateMerge(group1, group2);
    
    if (!mergeResult.valid) {
      // Construire un message d'erreur détaillé
      if (mergeResult.existingPath) {
        return {
          valid: false,
          errorType: 'EXISTING_TEMPORAL_PATH',
          message: this.buildExistingPathErrorMessage(
            entity1Uuid,
            entity2Uuid,
            mergeResult.existingPath
          ),
          existingPath: {
            path: mergeResult.existingPath,
            pathTags: mergeResult.existingPath.map(g => this.getRepresentativeTag(g))
          }
        };
      }
      
      if (mergeResult.conflictingGroups && mergeResult.conflictingGroups.length > 0) {
        return {
          valid: false,
          errorType: 'WOULD_CREATE_CYCLE',
          message: this.buildMergeConflictErrorMessage(
            entity1Uuid,
            entity2Uuid,
            mergeResult.conflictingGroups
          ),
          conflictingGroups: mergeResult.conflictingGroups
        };
      }
    }
    
    return { valid: true };
  }

  /**
   * Ajoute une relation de contemporanéité validée
   * Fusionne les groupes et met à jour le graphe quotient
   */
  addContemporaneityRelation(relation: StratigraphicRelation): void {
    if (!relation.isContemporain || !relation.live) return;
    if (!relation.anterieur || !relation.posterieur) return;
    
    const entity1Uuid = relation.anterieur.uuid;
    const entity2Uuid = relation.posterieur.uuid;
    
    // S'assurer que les entités sont enregistrées
    if (!this.groups.has(entity1Uuid)) {
      this.registerEntity(relation.anterieur);
    }
    if (!this.groups.has(entity2Uuid)) {
      this.registerEntity(relation.posterieur);
    }
    
    const oldGroup1 = this.groups.find(entity1Uuid)!;
    const oldGroup2 = this.groups.find(entity2Uuid)!;
    
    if (oldGroup1 === oldGroup2) {
      // Déjà dans le même groupe, rien à faire
      this.relations.set(relation.uuid, relation);
      return;
    }
    
    // Fusionner les groupes dans DisjointSet
    this.groups.union(entity1Uuid, entity2Uuid);
    const newGroup = this.groups.find(entity1Uuid)!;
    
    // Fusionner les nœuds dans le graphe quotient
    const groupToMerge = newGroup === oldGroup1 ? oldGroup2 : oldGroup1;
    this.quotientGraph.mergeNodes(groupToMerge, newGroup);
    
    // Stocker la relation
    this.relations.set(relation.uuid, relation);
  }

  // ============================================================
  // SUPPRESSION DE RELATIONS
  // ============================================================

  /**
   * Supprime une relation temporelle
   */
  removeTemporalRelation(relationUuid: string): void {
    const relation = this.relations.get(relationUuid);
    if (!relation || relation.isContemporain) return;
    if (!relation.anterieur || !relation.posterieur) return;
    
    const groupAnt = this.groups.find(relation.anterieur.uuid);
    const groupPost = this.groups.find(relation.posterieur.uuid);
    
    if (groupAnt && groupPost) {
      this.quotientGraph.removeRelationFromEdge(groupPost, groupAnt, relationUuid);
    }
    
    this.relations.delete(relationUuid);
  }

  /**
   * Supprime une relation de contemporanéité
   * Note : Ceci peut nécessiter de reconstruire les groupes
   */
  removeContemporaneityRelation(relationUuid: string): void {
    const relation = this.relations.get(relationUuid);
    if (!relation || !relation.isContemporain) return;
    
    this.relations.delete(relationUuid);
    
    // La suppression d'une relation de contemporanéité peut scinder un groupe
    // Pour l'instant, on marque qu'il faut reconstruire
    // Une optimisation serait de vérifier si la suppression scinde effectivement le groupe
  }

  // ============================================================
  // RECONSTRUCTION COMPLÈTE
  // ============================================================

  /**
   * Reconstruit toutes les structures à partir d'une liste de relations
   * Appelé lors de l'initialisation ou après des changements massifs
   */
  rebuild(allRelations: StratigraphicRelation[]): void {
    this.clear();
    
    const activeRelations = allRelations.filter(r => r.live);
    
    // Phase 1 : Enregistrer toutes les entités
    activeRelations.forEach(relation => {
      if (relation.anterieur) {
        this.registerEntity(relation.anterieur);
      }
      if (relation.posterieur) {
        this.registerEntity(relation.posterieur);
      }
    });
    
    // Phase 2 : Traiter d'abord les relations de contemporanéité
    // (pour construire les groupes avant d'ajouter les relations temporelles)
    activeRelations
      .filter(r => r.isContemporain)
      .forEach(relation => {
        if (relation.anterieur && relation.posterieur) {
          this.groups.union(relation.anterieur.uuid, relation.posterieur.uuid);
          this.relations.set(relation.uuid, relation);
        }
      });
    
    // Phase 3 : Mettre à jour le graphe quotient avec les nouveaux groupes
    this.rebuildQuotientGraphNodes();
    
    // Phase 4 : Ajouter les relations temporelles
    activeRelations
      .filter(r => !r.isContemporain)
      .forEach(relation => {
        if (relation.anterieur && relation.posterieur) {
          const groupAnt = this.groups.find(relation.anterieur.uuid)!;
          const groupPost = this.groups.find(relation.posterieur.uuid)!;
          
          if (groupAnt !== groupPost) {
            this.quotientGraph.addEdge(groupPost, groupAnt, relation.uuid);
          }
          this.relations.set(relation.uuid, relation);
        }
      });
  }

  /**
   * Reconstruit les nœuds du graphe quotient à partir des groupes actuels
   */
  private rebuildQuotientGraphNodes(): void {
    this.quotientGraph.clear();
    
    this.groups.getAllRoots().forEach(root => {
      this.quotientGraph.addNode(root);
    });
  }

  /**
   * Réinitialise complètement le gestionnaire
   */
  clear(): void {
    this.groups.clear();
    this.quotientGraph.clear();
    this.entities.clear();
    this.relations.clear();
  }

  // ============================================================
  // MÉTHODES DE DEBUG ET MESSAGES D'ERREUR
  // ============================================================

  /**
   * Retourne un tag représentatif pour un groupe
   */
  private getRepresentativeTag(groupId: string): string {
    const members = this.getGroupMembers(groupId);
    if (members.length === 0) {
      return this.getTag(groupId);
    }
    
    // Retourner les tags de tous les membres
    const tags = members.map(m => this.getTag(m));
    if (tags.length === 1) {
      return tags[0];
    }
    return `{${tags.join(', ')}}`;
  }

  /**
   * Construit le message d'erreur pour le cas "même groupe"
   */
  private buildSameGroupErrorMessage(
    entity1: string,
    entity2: string,
    groupMembers: string[]
  ): string {
    const tag1 = this.getTag(entity1);
    const tag2 = this.getTag(entity2);
    
    if (groupMembers.length <= 2) {
      return `Impossible de créer une relation temporelle entre ${tag1} et ${tag2} : ` +
        `ils sont contemporains.`;
    }
    
    const otherMembers = groupMembers
      .filter(m => m !== entity1 && m !== entity2)
      .map(m => this.getTag(m));
    
    const chainDescription = this.buildContemporaneityChain(entity1, entity2, groupMembers);
    
    return `Impossible de créer une relation temporelle entre ${tag1} et ${tag2} : ` +
      `ils sont contemporains (directement ou via la chaîne : ${chainDescription}).`;
  }

  /**
   * Construit une description de la chaîne de contemporanéité entre deux entités
   */
  private buildContemporaneityChain(entity1: string, entity2: string, groupMembers: string[]): string {
    // Simplification : on liste juste les membres du groupe
    return groupMembers.map(m => this.getTag(m)).join(' ↔ ');
  }

  /**
   * Construit le message d'erreur pour un cycle détecté
   */
  private buildCycleErrorMessage(cyclePath: string[]): string {
    const pathDescription = cyclePath
      .map(g => this.getRepresentativeTag(g))
      .join(' → ');
    
    return `Contradiction détectée : cycle stratigraphique impossible.\n` +
      `Chaîne : ${pathDescription} → ${this.getRepresentativeTag(cyclePath[0])}\n` +
      `Une unité stratigraphique ne peut pas être à la fois antérieure et postérieure à elle-même.`;
  }

  /**
   * Construit le message d'erreur pour un chemin temporel existant
   */
  private buildExistingPathErrorMessage(
    entity1: string,
    entity2: string,
    path: string[]
  ): string {
    const tag1 = this.getTag(entity1);
    const tag2 = this.getTag(entity2);
    const pathDescription = path
      .map(g => this.getRepresentativeTag(g))
      .join(' → ');
    
    return `Impossible de rendre ${tag1} contemporain de ${tag2} : ` +
      `il existe une chaîne temporelle entre eux.\n` +
      `Chaîne : ${pathDescription}`;
  }

  /**
   * Construit le message d'erreur pour un conflit de fusion
   */
  private buildMergeConflictErrorMessage(
    entity1: string,
    entity2: string,
    conflictingGroups: string[]
  ): string {
    const tag1 = this.getTag(entity1);
    const tag2 = this.getTag(entity2);
    const conflictingTags = conflictingGroups
      .map(g => this.getRepresentativeTag(g))
      .join(', ');
    
    return `Impossible de rendre ${tag1} contemporain de ${tag2} : ` +
      `la fusion créerait un paradoxe temporel.\n` +
      `Le groupe fusionné serait à la fois antérieur et postérieur à : ${conflictingTags}`;
  }

  // ============================================================
  // MÉTHODES D'EXPORT POUR DEBUG
  // ============================================================

  /**
   * Exporte l'état complet pour debug
   */
  getDebugState(): {
    groups: Map<string, string[]>;
    quotientGraph: string;
    relationCount: number;
    entityCount: number;
  } {
    return {
      groups: this.getAllGroups(),
      quotientGraph: this.quotientGraph.toDebugString(),
      relationCount: this.relations.size,
      entityCount: this.entities.size
    };
  }

  /**
   * Vérifie si le graphe quotient a un chemin entre deux groupes
   */
  hasTemporalPath(fromEntityUuid: string, toEntityUuid: string): boolean {
    const fromGroup = this.groups.find(fromEntityUuid);
    const toGroup = this.groups.find(toEntityUuid);
    
    if (!fromGroup || !toGroup) return false;
    
    return this.quotientGraph.hasPath(fromGroup, toGroup);
  }

  /**
   * Retourne le chemin temporel entre deux entités si existant
   */
  findTemporalPath(fromEntityUuid: string, toEntityUuid: string): PathResult | null {
    const fromGroup = this.groups.find(fromEntityUuid);
    const toGroup = this.groups.find(toEntityUuid);
    
    if (!fromGroup || !toGroup) return null;
    
    const result = this.quotientGraph.findPath(fromGroup, toGroup);
    return result.exists ? result : null;
  }
}
