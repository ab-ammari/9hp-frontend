/**
 * Lightweight bitset wrapper backed by Uint32Array.
 */
class Bitset {
  private words: Uint32Array;

  constructor(size: number) {
    this.words = new Uint32Array(Math.ceil(size / 32));
  }

  ensureSize(size: number): void {
    const needed = Math.ceil(size / 32);
    if (needed <= this.words.length) {
      return;
    }
    const next = new Uint32Array(needed);
    next.set(this.words);
    this.words = next;
  }

  clone(): Bitset {
    const copy = new Bitset(0);
    copy.words = this.words.slice();
    return copy;
  }

  clear(): void {
    this.words.fill(0);
  }

  set(bit: number): void {
    const word = bit >>> 5;
    const mask = 1 << (bit & 31);
    this.words[word] |= mask;
  }

  unset(bit: number): void {
    const word = bit >>> 5;
    const mask = 1 << (bit & 31);
    this.words[word] &= ~mask;
  }

  has(bit: number): boolean {
    const word = bit >>> 5;
    return (this.words[word] & (1 << (bit & 31))) !== 0;
  }

  or(other: Bitset): void {
    const minLength = Math.min(this.words.length, other.words.length);
    for (let i = 0; i < minLength; i++) {
      this.words[i] |= other.words[i];
    }
  }

  toArray(): Uint32Array {
    return this.words;
  }
}

/**
 * Represents the partial order between DSU components.
 * Provides cycle detection and reachability caches via bitsets.
 */
export class ComponentDag {
  private adjacency: Array<Set<number>>;
  private predecessors: Array<Set<number>>;
  private reachability: Bitset[];
  private needsRebuild = false;

  constructor(initialSize: number) {
    this.adjacency = Array.from({length: initialSize}, () => new Set<number>());
    this.predecessors = Array.from({length: initialSize}, () => new Set<number>());
    this.reachability = Array.from({length: initialSize}, () => new Bitset(initialSize));
  }

  private ensureNode(node: number): void {
    const required = node + 1;
    if (required <= this.adjacency.length) {
      return;
    }
    const delta = required - this.adjacency.length;
    for (let i = 0; i < delta; i++) {
      this.adjacency.push(new Set<number>());
      this.predecessors.push(new Set<number>());
      this.reachability.push(new Bitset(this.adjacency.length));
    }
    this.reachability.forEach(bitset => bitset.ensureSize(this.adjacency.length));
  }

  ensureCapacity(size: number): void {
    if (size <= 0) {
      return;
    }
    this.ensureNode(size - 1);
  }

  private forEachPredecessor(node: number, visit: (pred: number) => void): void {
    this.predecessors[node].forEach(pred => {
      if (pred !== node) {
        visit(pred);
      }
    });
  }

  private forEachSuccessor(node: number, visit: (succ: number) => void): void {
    this.adjacency[node].forEach(succ => {
      if (succ !== node) {
        visit(succ);
      }
    });
  }

  /**
   * Checks whether there is a directed path from `source` to `target`.
   */
  canReach(source: number, target: number): boolean {
    if (this.needsRebuild) {
      this.rebuildReachability();
    }
    this.ensureNode(Math.max(source, target));
    return this.reachability[source]?.has(target) ?? false;
  }

  /**
   * Adds a directed edge `source → target`, returning false if it would create a cycle.
   */
  tryAddEdge(source: number, target: number): boolean {
    this.ensureNode(Math.max(source, target));
    if (source === target) {
      return false;
    }
    if (this.canReach(target, source)) {
      return false;
    }
    this.adjacency[source].add(target);
    this.predecessors[target].add(source);

    // Update reachability: everything that reaches source now reaches target and its reach set.
    const stack: number[] = [source];
    const visited = new Set<number>();
    while (stack.length) {
      const current = stack.pop()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
      const reach = this.reachability[current];
      reach.ensureSize(this.adjacency.length);
      reach.set(target);
      reach.or(this.reachability[target]);
      this.forEachPredecessor(current, predecessor => stack.push(predecessor));
    }
    return true;
  }

  /**
   * Redirects every edge touching `removed` to `kept` and merges reachability sets.
   */
  contractMerge(kept: number, removed: number): void {
    if (kept === removed) {
      return;
    }
    this.ensureNode(Math.max(kept, removed));

    // Redirect predecessors.
    this.predecessors[removed].forEach(pred => {
      if (pred === kept) {
        return;
      }
      this.adjacency[pred].delete(removed);
      this.adjacency[pred].add(kept);
      this.predecessors[kept].add(pred);
    });
    this.predecessors[removed].clear();

    // Redirect successors.
    this.adjacency[removed].forEach(succ => {
      if (succ === kept) {
        return;
      }
      this.predecessors[succ].delete(removed);
      this.predecessors[succ].add(kept);
      this.adjacency[kept].add(succ);
    });
    this.adjacency[removed].clear();

    // Merge reachability sets.
    this.reachability[kept].or(this.reachability[removed]);
    this.reachability[kept].set(kept);
    this.reachability[removed].clear();

    // Refresh predecessors of kept.
    const stack: number[] = [kept];
    const visited = new Set<number>();
    while (stack.length) {
      const current = stack.pop()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
      this.reachability[current].or(this.reachability[kept]);
      this.forEachPredecessor(current, predecessor => stack.push(predecessor));
    }
  }

  markForRebuild(): void {
    this.needsRebuild = true;
  }

  /**
   * Recomputes reachability from scratch (fallback path when mutations invalidate caches).
   */
  rebuildReachability(): void {
    const size = this.adjacency.length;
    this.reachability = Array.from({length: size}, () => new Bitset(size));
    for (let node = 0; node < size; node++) {
      const visited = new Set<number>();
      const stack: number[] = [node];
      while (stack.length) {
        const current = stack.pop()!;
        this.adjacency[current].forEach(next => {
          if (visited.has(next)) {
            return;
          }
          visited.add(next);
          this.reachability[node].set(next);
          stack.push(next);
        });
      }
    }
    this.needsRebuild = false;
  }

  /**
   * Removes a directed edge `source → target` if present.
   * Invalidates reachability cache (full rebuild deferred).
   */
  removeEdge(source: number, target: number): void {
    this.ensureNode(Math.max(source, target));
    if (this.adjacency[source].delete(target)) {
      this.predecessors[target].delete(source);
      this.markForRebuild();
    }
  }

  getEdgeCount(): number {
    return this.adjacency.reduce((acc, set) => acc + set.size, 0);
  }
}
