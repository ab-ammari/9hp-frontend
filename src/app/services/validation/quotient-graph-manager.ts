import { DisjointSet } from './disjoint-set';

/**
 * Représente une arête dans le graphe quotient
 * Une arête peut être supportée par plusieurs relations concrètes
 */
export interface QuotientEdge {
  /** Groupe source (postérieur) */
  from: string;
  /** Groupe destination (antérieur) */
  to: string;
  /** UUIDs des relations stratigraphiques concrètes supportant cette arête */
  underlyingRelations: Set<string>;
}

/**
 * Résultat d'une recherche de chemin
 */
export interface PathResult {
  exists: boolean;
  path: string[];
  /** Relations concrètes impliquées dans le chemin */
  relations: string[];
}

/**
 * Résultat de la simulation de fusion de groupes
 */
export interface MergeSimulationResult {
  /** La fusion est-elle possible sans créer de paradoxe ? */
  valid: boolean;
  /** Message d'erreur si invalide */
  errorMessage?: string;
  /** Groupes qui seraient à la fois prédécesseurs et successeurs (cause du paradoxe) */
  conflictingGroups?: string[];
  /** Chemin temporel existant entre les deux groupes */
  existingPath?: string[];
}

/**
 * QuotientGraphManager - Gère le graphe des relations entre groupes de contemporanéité
 * 
 * Ce graphe "quotient" condense les relations stratigraphiques :
 * - Les nœuds sont les groupes de contemporanéité (pas les entités individuelles)
 * - Les arêtes représentent les relations temporelles entre groupes
 * 
 * Permet de détecter efficacement :
 * - Les cycles (paradoxes temporels)
 * - Les chemins entre groupes (pour valider les nouvelles relations)
 * - Les conflits lors de fusion de groupes (création de contemporanéité)
 */
export class QuotientGraphManager {
  /**
   * Adjacence : pour chaque groupe, liste des groupes vers lesquels il pointe (antérieurs)
   * Direction : postérieur → antérieur (sens de la relation "sur")
   */
  private adjacencyList = new Map<string, Map<string, QuotientEdge>>();
  
  /**
   * Adjacence inverse : pour chaque groupe, liste des groupes qui pointent vers lui
   * Utile pour calculer les prédécesseurs efficacement
   */
  private reverseAdjacencyList = new Map<string, Set<string>>();
  
  /**
   * Cache de la fermeture transitive (prédécesseurs de chaque groupe)
   * Invalidé lors de modifications du graphe
   */
  private predecessorsCache = new Map<string, Set<string>>();
  
  /**
   * Cache de la fermeture transitive (successeurs de chaque groupe)
   */
  private successorsCache = new Map<string, Set<string>>();
  
  /**
   * Flag indiquant si les caches de fermeture transitive sont valides
   */
  private transitiveClosureCacheValid = false;

  /**
   * Ajoute un nœud (groupe) au graphe s'il n'existe pas
   */
  addNode(groupId: string): void {
    if (!this.adjacencyList.has(groupId)) {
      this.adjacencyList.set(groupId, new Map());
    }
    if (!this.reverseAdjacencyList.has(groupId)) {
      this.reverseAdjacencyList.set(groupId, new Set());
    }
  }

  /**
   * Ajoute une arête temporelle entre deux groupes
   * 
   * @param fromGroup Groupe postérieur (source de la relation "sur")
   * @param toGroup Groupe antérieur (destination de la relation "sur")
   * @param relationUuid UUID de la relation stratigraphique concrète
   * @returns true si c'est une nouvelle arête, false si elle existait déjà
   */
  addEdge(fromGroup: string, toGroup: string, relationUuid: string): boolean {
    this.addNode(fromGroup);
    this.addNode(toGroup);
    
    const edges = this.adjacencyList.get(fromGroup)!;
    const isNewEdge = !edges.has(toGroup);
    
    if (isNewEdge) {
      edges.set(toGroup, {
        from: fromGroup,
        to: toGroup,
        underlyingRelations: new Set([relationUuid])
      });
      this.reverseAdjacencyList.get(toGroup)!.add(fromGroup);
      this.invalidateTransitiveClosureCache();
    } else {
      // Arête existante : ajouter la relation à la liste
      edges.get(toGroup)!.underlyingRelations.add(relationUuid);
    }
    
    return isNewEdge;
  }

  /**
   * Supprime une relation concrète d'une arête
   * Si l'arête n'a plus de relations sous-jacentes, elle est supprimée
   * 
   * @returns true si l'arête a été complètement supprimée
   */
  removeRelationFromEdge(fromGroup: string, toGroup: string, relationUuid: string): boolean {
    const edges = this.adjacencyList.get(fromGroup);
    if (!edges) return false;
    
    const edge = edges.get(toGroup);
    if (!edge) return false;
    
    edge.underlyingRelations.delete(relationUuid);
    
    if (edge.underlyingRelations.size === 0) {
      edges.delete(toGroup);
      this.reverseAdjacencyList.get(toGroup)?.delete(fromGroup);
      this.invalidateTransitiveClosureCache();
      return true;
    }
    
    return false;
  }

  /**
   * Vérifie s'il existe un chemin de fromGroup vers toGroup
   * Utilise BFS pour trouver le chemin le plus court
   */
  hasPath(fromGroup: string, toGroup: string): boolean {
    return this.findPath(fromGroup, toGroup).exists;
  }

  /**
   * Trouve un chemin de fromGroup vers toGroup
   * Retourne le chemin et les relations impliquées
   */
  findPath(fromGroup: string, toGroup: string): PathResult {
    if (fromGroup === toGroup) {
      return { exists: true, path: [fromGroup], relations: [] };
    }
    
    if (!this.adjacencyList.has(fromGroup) || !this.adjacencyList.has(toGroup)) {
      return { exists: false, path: [], relations: [] };
    }
    
    // BFS pour trouver le chemin le plus court
    const visited = new Set<string>();
    const queue: Array<{ node: string; path: string[]; relations: string[] }> = [
      { node: fromGroup, path: [fromGroup], relations: [] }
    ];
    
    while (queue.length > 0) {
      const { node, path, relations } = queue.shift()!;
      
      if (visited.has(node)) continue;
      visited.add(node);
      
      const neighbors = this.adjacencyList.get(node);
      if (!neighbors) continue;
      
      for (const [neighbor, edge] of neighbors) {
        if (neighbor === toGroup) {
          return {
            exists: true,
            path: [...path, neighbor],
            relations: [...relations, ...edge.underlyingRelations]
          };
        }
        
        if (!visited.has(neighbor)) {
          queue.push({
            node: neighbor,
            path: [...path, neighbor],
            relations: [...relations, ...edge.underlyingRelations]
          });
        }
      }
    }
    
    return { exists: false, path: [], relations: [] };
  }

  /**
   * Détecte si l'ajout d'une arête créerait un cycle
   * 
   * @param fromGroup Groupe source (postérieur)
   * @param toGroup Groupe destination (antérieur)
   * @returns Le cycle détecté si présent, null sinon
   */
  wouldCreateCycle(fromGroup: string, toGroup: string): PathResult | null {
    // Un cycle serait créé si toGroup peut déjà atteindre fromGroup
    // Car on ajouterait fromGroup → toGroup, créant toGroup → ... → fromGroup → toGroup
    const pathResult = this.findPath(toGroup, fromGroup);
    
    if (pathResult.exists) {
      // pathResult.path = [toGroup, ..., fromGroup]
      // On veut retourner le cycle : [fromGroup, toGroup, ..., (sans fromGroup à la fin)]
      // Puis le message ajoutera fromGroup à la fin pour fermer le cycle
      
      // Enlever le dernier élément s'il est égal à fromGroup (pour éviter la duplication)
      const pathWithoutLastDuplicate = pathResult.path.slice(0, -1);
      
      return {
        exists: true,
        path: [fromGroup, ...pathWithoutLastDuplicate],
        relations: pathResult.relations
      };
    }
    
    return null;
  }

  /**
   * Calcule tous les prédécesseurs d'un groupe (fermeture transitive inverse)
   * Un prédécesseur est un groupe qui peut atteindre ce groupe via des arêtes
   */
  getAllPredecessors(groupId: string): Set<string> {
    this.ensureTransitiveClosureCacheValid();
    return this.predecessorsCache.get(groupId) || new Set();
  }

  /**
   * Calcule tous les successeurs d'un groupe (fermeture transitive)
   * Un successeur est un groupe atteignable depuis ce groupe
   */
  getAllSuccessors(groupId: string): Set<string> {
    this.ensureTransitiveClosureCacheValid();
    return this.successorsCache.get(groupId) || new Set();
  }

  /**
   * Simule la fusion de deux groupes et vérifie si elle créerait un paradoxe
   * 
   * C'est la vérification CRITIQUE pour les relations de contemporanéité :
   * Si deux groupes Gx et Gy sont fusionnés, le nouveau groupe G' aurait :
   * - predecessors(G') = predecessors(Gx) ∪ predecessors(Gy)
   * - successors(G') = successors(Gx) ∪ successors(Gy)
   * 
   * Si predecessors(G') ∩ successors(G') ≠ ∅, c'est un paradoxe :
   * G' serait à la fois antérieur ET postérieur à certains groupes
   */
  simulateMerge(groupX: string, groupY: string): MergeSimulationResult {
    // Cas 1 : Même groupe, pas de fusion nécessaire
    if (groupX === groupY) {
      return { valid: true };
    }
    
    // Cas 2 : Vérifier s'il existe un chemin direct entre les deux groupes
    const pathXtoY = this.findPath(groupX, groupY);
    if (pathXtoY.exists) {
      return {
        valid: false,
        errorMessage: `Impossible de rendre contemporains : il existe une chaîne temporelle de ${groupX} vers ${groupY}`,
        existingPath: pathXtoY.path
      };
    }
    
    const pathYtoX = this.findPath(groupY, groupX);
    if (pathYtoX.exists) {
      return {
        valid: false,
        errorMessage: `Impossible de rendre contemporains : il existe une chaîne temporelle de ${groupY} vers ${groupX}`,
        existingPath: pathYtoX.path
      };
    }
    
    // Cas 3 : Simuler la fusion et vérifier les conflits
    this.ensureTransitiveClosureCacheValid();
    
    const predecessorsX = this.predecessorsCache.get(groupX) || new Set<string>();
    const predecessorsY = this.predecessorsCache.get(groupY) || new Set<string>();
    const successorsX = this.successorsCache.get(groupX) || new Set<string>();
    const successorsY = this.successorsCache.get(groupY) || new Set<string>();
    
    // Prédécesseurs et successeurs du groupe fusionné (en excluant les groupes fusionnés eux-mêmes)
    const mergedPredecessors = new Set<string>();
    const mergedSuccessors = new Set<string>();
    
    predecessorsX.forEach(p => { if (p !== groupX && p !== groupY) mergedPredecessors.add(p); });
    predecessorsY.forEach(p => { if (p !== groupX && p !== groupY) mergedPredecessors.add(p); });
    successorsX.forEach(s => { if (s !== groupX && s !== groupY) mergedSuccessors.add(s); });
    successorsY.forEach(s => { if (s !== groupX && s !== groupY) mergedSuccessors.add(s); });
    
    // Vérifier l'intersection
    const conflicting: string[] = [];
    mergedPredecessors.forEach(p => {
      if (mergedSuccessors.has(p)) {
        conflicting.push(p);
      }
    });
    
    if (conflicting.length > 0) {
      return {
        valid: false,
        errorMessage: `La fusion créerait un paradoxe : le groupe fusionné serait à la fois antérieur et postérieur à certains groupes`,
        conflictingGroups: conflicting
      };
    }
    
    return { valid: true };
  }

  /**
   * Retourne toutes les arêtes sortantes d'un groupe
   */
  getOutgoingEdges(groupId: string): QuotientEdge[] {
    const edges = this.adjacencyList.get(groupId);
    if (!edges) return [];
    return Array.from(edges.values());
  }

  /**
   * Retourne tous les groupes qui ont une arête vers ce groupe
   */
  getIncomingGroups(groupId: string): string[] {
    return Array.from(this.reverseAdjacencyList.get(groupId) || []);
  }

  /**
   * Vérifie si une arête existe entre deux groupes
   */
  hasEdge(fromGroup: string, toGroup: string): boolean {
    return this.adjacencyList.get(fromGroup)?.has(toGroup) || false;
  }

  /**
   * Retourne l'arête entre deux groupes si elle existe
   */
  getEdge(fromGroup: string, toGroup: string): QuotientEdge | null {
    return this.adjacencyList.get(fromGroup)?.get(toGroup) || null;
  }

  /**
   * Retourne tous les nœuds du graphe
   */
  getAllNodes(): string[] {
    return Array.from(this.adjacencyList.keys());
  }

  /**
   * Retourne toutes les arêtes du graphe
   */
  getAllEdges(): QuotientEdge[] {
    const edges: QuotientEdge[] = [];
    this.adjacencyList.forEach(neighbors => {
      neighbors.forEach(edge => edges.push(edge));
    });
    return edges;
  }

  /**
   * Réinitialise le graphe
   */
  clear(): void {
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();
    this.invalidateTransitiveClosureCache();
  }

  /**
   * Fusionne deux nœuds du graphe (appelé après fusion de groupes de contemporanéité)
   * Toutes les arêtes de/vers oldGroup sont transférées vers newGroup
   */
  mergeNodes(oldGroup: string, newGroup: string): void {
    if (oldGroup === newGroup) return;
    
    // Transférer les arêtes sortantes
    const outgoing = this.adjacencyList.get(oldGroup);
    if (outgoing) {
      if (!this.adjacencyList.has(newGroup)) {
        this.adjacencyList.set(newGroup, new Map());
      }
      const newOutgoing = this.adjacencyList.get(newGroup)!;
      
      outgoing.forEach((edge, target) => {
        if (target === newGroup) return; // Éviter les auto-boucles
        
        if (newOutgoing.has(target)) {
          // Fusionner les relations
          edge.underlyingRelations.forEach(r => 
            newOutgoing.get(target)!.underlyingRelations.add(r)
          );
        } else {
          newOutgoing.set(target, {
            from: newGroup,
            to: target,
            underlyingRelations: new Set(edge.underlyingRelations)
          });
        }
        // Mettre à jour l'adjacence inverse
        this.reverseAdjacencyList.get(target)?.delete(oldGroup);
        this.reverseAdjacencyList.get(target)?.add(newGroup);
      });
    }
    
    // Transférer les arêtes entrantes
    const incoming = this.reverseAdjacencyList.get(oldGroup);
    if (incoming) {
      if (!this.reverseAdjacencyList.has(newGroup)) {
        this.reverseAdjacencyList.set(newGroup, new Set());
      }
      
      incoming.forEach(source => {
        if (source === newGroup) return; // Éviter les auto-boucles
        
        const sourceEdges = this.adjacencyList.get(source);
        if (sourceEdges) {
          const oldEdge = sourceEdges.get(oldGroup);
          if (oldEdge) {
            sourceEdges.delete(oldGroup);
            
            if (sourceEdges.has(newGroup)) {
              oldEdge.underlyingRelations.forEach(r =>
                sourceEdges.get(newGroup)!.underlyingRelations.add(r)
              );
            } else {
              sourceEdges.set(newGroup, {
                from: source,
                to: newGroup,
                underlyingRelations: new Set(oldEdge.underlyingRelations)
              });
            }
            
            this.reverseAdjacencyList.get(newGroup)?.add(source);
          }
        }
      });
    }
    
    // Supprimer l'ancien nœud
    this.adjacencyList.delete(oldGroup);
    this.reverseAdjacencyList.delete(oldGroup);
    
    this.invalidateTransitiveClosureCache();
  }

  /**
   * Invalide le cache de fermeture transitive
   */
  private invalidateTransitiveClosureCache(): void {
    this.transitiveClosureCacheValid = false;
    this.predecessorsCache.clear();
    this.successorsCache.clear();
  }

  /**
   * Calcule la fermeture transitive si nécessaire
   */
  private ensureTransitiveClosureCacheValid(): void {
    if (this.transitiveClosureCacheValid) {
      return;
    }
    
    this.predecessorsCache.clear();
    this.successorsCache.clear();
    
    const nodes = this.getAllNodes();
    
    // Initialiser les caches
    nodes.forEach(node => {
      this.predecessorsCache.set(node, new Set());
      this.successorsCache.set(node, new Set());
    });
    
    // Calculer les successeurs par BFS depuis chaque nœud
    nodes.forEach(startNode => {
      const visited = new Set<string>();
      const queue = [startNode];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        
        const neighbors = this.adjacencyList.get(current);
        if (!neighbors) continue;
        
        neighbors.forEach((_, neighbor) => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            this.successorsCache.get(startNode)!.add(neighbor);
            // Le startNode est un prédécesseur de neighbor
            this.predecessorsCache.get(neighbor)!.add(startNode);
            queue.push(neighbor);
          }
        });
      }
    });
    
    this.transitiveClosureCacheValid = true;
  }

  /**
   * Export du graphe pour debug/visualisation
   */
  toDebugString(): string {
    const lines: string[] = ['QuotientGraph:'];
    
    this.adjacencyList.forEach((edges, from) => {
      edges.forEach((edge, to) => {
        lines.push(`  ${from} → ${to} (${edge.underlyingRelations.size} relations)`);
      });
    });
    
    if (lines.length === 1) {
      lines.push('  (empty)');
    }
    
    return lines.join('\n');
  }
}
