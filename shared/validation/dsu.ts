/**
 * Disjoint-set union (Union-Find) structure with dynamic growth.
 * Maintains component size and exposes union-by-rank with path compression.
 */
export class DisjointSet {
  private parent: Int32Array;
  private rank: Int8Array;
  private compSize: Int32Array;
  private components: number;

  constructor(initialSize: number = 0) {
    this.parent = new Int32Array(initialSize);
    this.rank = new Int8Array(initialSize);
    this.compSize = new Int32Array(initialSize);
    this.components = initialSize;
    for (let i = 0; i < initialSize; i++) {
      this.parent[i] = i;
      this.compSize[i] = 1;
    }
  }

  /**
   * Ensures that the structure can accommodate `size` elements.
   */
  ensureSize(size: number): void {
    const current = this.parent.length;
    if (size <= current) {
      return;
    }
    const next = new Int32Array(size);
    next.set(this.parent);
    for (let i = current; i < size; i++) {
      next[i] = i;
    }
    this.parent = next;

    const nextRank = new Int8Array(size);
    nextRank.set(this.rank);
    this.rank = nextRank;

    const nextSize = new Int32Array(size);
    nextSize.set(this.compSize);
    for (let i = current; i < size; i++) {
      nextSize[i] = 1;
    }
    this.compSize = nextSize;

    this.components += size - current;
  }

  /**
   * Finds the representative element of the set containing `node`.
   */
  find(node: number): number {
    let root = node;
    while (this.parent[root] !== root) {
      root = this.parent[root];
    }
    // Path compression.
    let current = node;
    while (current !== root) {
      const next = this.parent[current];
      this.parent[current] = root;
      current = next;
    }
    return root;
  }

  /**
   * Unions the sets containing `a` and `b`.
   * Returns details about the merge result.
   */
  union(a: number, b: number): { merged: boolean; root: number; absorbed?: number } {
    let rootA = this.find(a);
    let rootB = this.find(b);
    if (rootA === rootB) {
      return { merged: false, root: rootA };
    }

    if (this.rank[rootA] < this.rank[rootB]) {
      [rootA, rootB] = [rootB, rootA];
    }
    this.parent[rootB] = rootA;
    this.compSize[rootA] += this.compSize[rootB];
    if (this.rank[rootA] === this.rank[rootB]) {
      this.rank[rootA]++;
    }
    this.components--;
    return { merged: true, root: rootA, absorbed: rootB };
  }

  /**
   * Returns the size of the component containing `node`.
   */
  size(node: number): number {
    return this.compSize[this.find(node)] ?? 0;
  }

  /**
   * Returns the number of disjoint components currently tracked.
   */
  getComponentCount(): number {
    return this.components;
  }
}
