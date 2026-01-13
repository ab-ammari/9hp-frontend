/**
 * DisjointSet (Union-Find) - Structure de données pour gérer les groupes de contemporanéité
 * 
 * Cette structure permet de :
 * - Trouver le groupe d'un élément en O(α(n)) ≈ O(1) amorti
 * - Fusionner deux groupes en O(α(n)) ≈ O(1) amorti
 * - Vérifier si deux éléments sont dans le même groupe en O(α(n))
 * 
 * Utilise deux optimisations classiques :
 * - Path compression : lors de find(), on rattache directement les nœuds à la racine
 * - Union by rank : on rattache toujours le plus petit arbre sous le plus grand
 */
export class DisjointSet<T> {
  /**
   * Map de chaque élément vers son parent
   * Si parent[x] === x, alors x est la racine de son groupe
   */
  private parent = new Map<T, T>();
  
  /**
   * Rang (approximation de la hauteur) de chaque racine
   * Utilisé pour l'optimisation "union by rank"
   */
  private rank = new Map<T, number>();
  
  /**
   * Cache des membres de chaque groupe (indexé par la racine)
   * Invalidé lors des fusions pour être recalculé à la demande
   */
  private groupMembersCache = new Map<T, Set<T>>();
  
  /**
   * Flag indiquant si le cache des groupes est valide
   */
  private cacheValid = false;

  /**
   * Ajoute un élément comme son propre groupe (singleton)
   * Si l'élément existe déjà, ne fait rien
   */
  makeSet(x: T): void {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
      this.invalidateCache();
    }
  }

  /**
   * Trouve la racine (représentant) du groupe contenant x
   * Applique la compression de chemin pour optimiser les accès futurs
   * 
   * @returns La racine du groupe, ou null si x n'existe pas
   */
  find(x: T): T | null {
    if (!this.parent.has(x)) {
      return null;
    }
    
    // Compression de chemin : on remonte jusqu'à la racine
    // et on rattache directement tous les nœuds traversés à la racine
    const parentOfX = this.parent.get(x)!;
    if (parentOfX !== x) {
      const root = this.find(parentOfX);
      if (root !== null) {
        this.parent.set(x, root);
      }
    }
    return this.parent.get(x)!;
  }

  /**
   * Fusionne les groupes contenant x et y
   * Utilise "union by rank" pour garder les arbres équilibrés
   * 
   * @returns true si une fusion a eu lieu, false si x et y étaient déjà dans le même groupe
   */
  union(x: T, y: T): boolean {
    // S'assurer que les deux éléments existent
    this.makeSet(x);
    this.makeSet(y);
    
    const rootX = this.find(x)!;
    const rootY = this.find(y)!;
    
    // Déjà dans le même groupe
    if (rootX === rootY) {
      return false;
    }
    
    // Union by rank : on attache le plus petit arbre sous le plus grand
    const rankX = this.rank.get(rootX)!;
    const rankY = this.rank.get(rootY)!;
    
    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    } else {
      // Même rang : on choisit arbitrairement et on incrémente le rang
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }
    
    this.invalidateCache();
    return true;
  }

  /**
   * Vérifie si deux éléments sont dans le même groupe
   */
  connected(x: T, y: T): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);
    
    if (rootX === null || rootY === null) {
      return false;
    }
    
    return rootX === rootY;
  }

  /**
   * Retourne tous les éléments du groupe contenant x
   */
  getGroupMembers(x: T): Set<T> {
    const root = this.find(x);
    if (root === null) {
      return new Set();
    }
    
    this.ensureCacheValid();
    return this.groupMembersCache.get(root) || new Set();
  }

  /**
   * Retourne tous les groupes sous forme de Map<racine, Set<membres>>
   */
  getAllGroups(): Map<T, Set<T>> {
    this.ensureCacheValid();
    return new Map(this.groupMembersCache);
  }

  /**
   * Retourne le nombre de groupes distincts
   */
  getGroupCount(): number {
    this.ensureCacheValid();
    return this.groupMembersCache.size;
  }

  /**
   * Retourne toutes les racines (représentants de groupes)
   */
  getAllRoots(): Set<T> {
    this.ensureCacheValid();
    return new Set(this.groupMembersCache.keys());
  }

  /**
   * Vérifie si un élément existe dans la structure
   */
  has(x: T): boolean {
    return this.parent.has(x);
  }

  /**
   * Retourne le nombre total d'éléments
   */
  size(): number {
    return this.parent.size;
  }

  /**
   * Réinitialise complètement la structure
   */
  clear(): void {
    this.parent.clear();
    this.rank.clear();
    this.groupMembersCache.clear();
    this.cacheValid = false;
  }

  /**
   * Crée une copie de la structure (utile pour les simulations)
   */
  clone(): DisjointSet<T> {
    const copy = new DisjointSet<T>();
    copy.parent = new Map(this.parent);
    copy.rank = new Map(this.rank);
    // Le cache sera recalculé à la demande
    return copy;
  }

  /**
   * Simule une fusion sans modifier la structure originale
   * Retourne la nouvelle racine du groupe fusionné
   */
  simulateUnion(x: T, y: T): { 
    mergedRoot: T | null; 
    wouldMerge: boolean;
    groupMembers: Set<T>;
  } {
    const rootX = this.find(x);
    const rootY = this.find(y);
    
    if (rootX === null || rootY === null) {
      return { mergedRoot: null, wouldMerge: false, groupMembers: new Set() };
    }
    
    if (rootX === rootY) {
      return { 
        mergedRoot: rootX, 
        wouldMerge: false, 
        groupMembers: this.getGroupMembers(rootX) 
      };
    }
    
    // Simuler la fusion
    const membersX = this.getGroupMembers(rootX);
    const membersY = this.getGroupMembers(rootY);
    const mergedMembers = new Set([...membersX, ...membersY]);
    
    // Déterminer la nouvelle racine selon union by rank
    const rankX = this.rank.get(rootX)!;
    const rankY = this.rank.get(rootY)!;
    const mergedRoot = rankX >= rankY ? rootX : rootY;
    
    return {
      mergedRoot,
      wouldMerge: true,
      groupMembers: mergedMembers
    };
  }

  /**
   * Invalide le cache des groupes
   */
  private invalidateCache(): void {
    this.cacheValid = false;
    this.groupMembersCache.clear();
  }

  /**
   * Reconstruit le cache des groupes si nécessaire
   */
  private ensureCacheValid(): void {
    if (this.cacheValid) {
      return;
    }
    
    this.groupMembersCache.clear();
    
    // Parcourir tous les éléments et les regrouper par racine
    this.parent.forEach((_, element) => {
      const root = this.find(element)!;
      
      if (!this.groupMembersCache.has(root)) {
        this.groupMembersCache.set(root, new Set());
      }
      this.groupMembersCache.get(root)!.add(element);
    });
    
    this.cacheValid = true;
  }
}
