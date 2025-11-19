import {ApiStratigraphie} from "../objects/models/DbInterfaces";
import {DisjointSet} from "./dsu";
import {ComponentDag} from "./dag";
import {NodeIndexer} from "./indexer";

export type ValidationOk = { ok: true };
export type ValidationErrorReason =
  | "SELF_TARGETING"
  | "CYCLE_DETECTED"
  | "PRESENT_CONFLICT"
  | "INVALID_ENDPOINT";
export type ValidationError = { ok: false; reason: ValidationErrorReason };
export type ValidationResult = ValidationOk | ValidationError;

type RelationRecord = {
  relation: ApiStratigraphie;
};

/**
 * Coordinates node indexing, DSU and DAG life-cycle to validate and apply stratigraphie relations.
 */
export class StratigraphieValidator {
  private readonly indexer = new NodeIndexer();
  private dsu = new DisjointSet();
  private dag: ComponentDag = new ComponentDag(0);

  private readonly relations = new Map<string, RelationRecord>();

  reset(): void {
    this.indexer.reset();
    this.dsu = new DisjointSet();
    this.dag = new ComponentDag(0);
    this.relations.clear();
  }

  initGraph(nodes: string[], relations: ApiStratigraphie[]): void {
    this.reset();
    nodes.forEach(node => {
      this.indexer.getOrCreateId(node);
    });
    this.ensureCapacity();
    relations.forEach(relation => {
      if (relation?.live === false) {
        return;
      }
      const result = this.applyRelation(relation);
      if (!result.ok) {
        const reason = (result as ValidationError).reason;
        throw new Error(`Invalid relation during init (${relation.stratigraphie_uuid}): ${reason}`);
      }
    });
  }

  /**
   * Validates a relation without mutating internal state.
   */
  validateRelation(relation: ApiStratigraphie): ValidationResult {
    if (!relation) {
      return {ok: false, reason: "INVALID_ENDPOINT"};
    }
    const {anterior, posterior} = this.indexer.getRelationEndpoints(relation);
    if (relation.is_contemporain) {
      if (anterior == null || posterior == null) {
        return {ok: false, reason: "INVALID_ENDPOINT"};
      }
      this.ensureCapacity();
      const rootA = this.dsu.find(anterior);
      const rootB = this.dsu.find(posterior);
      if (rootA === rootB) {
        return {ok: true};
      }
      if (this.dag.canReach(rootA, rootB) || this.dag.canReach(rootB, rootA)) {
        return {ok: false, reason: "PRESENT_CONFLICT"};
      }
      return {ok: true};
    }

    // Non-contemporaneous relation.
    if (anterior == null || posterior == null) {
      return {ok: false, reason: "INVALID_ENDPOINT"};
    }
    this.ensureCapacity();
    const source = this.dsu.find(anterior);
    const target = this.dsu.find(posterior);
    if (source === target) {
      return {ok: false, reason: "SELF_TARGETING"};
    }
    if (this.dag.canReach(target, source)) {
      return {ok: false, reason: "CYCLE_DETECTED"};
    }
    return {ok: true};
  }

  /**
   * Applies a relation mutation (add/update) to the underlying structures.
   */
  applyRelation(relation: ApiStratigraphie): ValidationResult {
    if (relation?.live === false) {
      if (relation?.stratigraphie_uuid) {
        this.relations.delete(relation.stratigraphie_uuid);
      }
      return {ok: true};
    }
    const validation = this.validateRelation(relation);
    if (!validation.ok) {
      return validation;
    }
    const {anterior, posterior} = this.indexer.getRelationEndpoints(relation);
    this.ensureCapacity();
    if (relation.is_contemporain) {
      const rootA = this.dsu.find(anterior!);
      const rootB = this.dsu.find(posterior!);
      const merge = this.dsu.union(rootA, rootB);
      if (merge.merged && merge.absorbed !== undefined) {
        this.dag.contractMerge(merge.root, merge.absorbed);
      }
    } else {
      const source = this.dsu.find(anterior!);
      const target = this.dsu.find(posterior!);
      const added = this.dag.tryAddEdge(source, target);
      if (!added) {
        return {ok: false, reason: "CYCLE_DETECTED"};
      }
    }

    if (relation.stratigraphie_uuid) {
      this.relations.set(relation.stratigraphie_uuid, {relation});
    }
    return {ok: true};
  }

  /**
   * Applies a diff of relations (remove/update/add).
   * Throws when at least one addition/update becomes invalid.
   */
  applyDiff(diff: {
    added?: ApiStratigraphie[],
    removed?: string[],
    updated?: ApiStratigraphie[]
  }): void {
    const removedIds = diff.removed ?? [];
    removedIds.forEach(id => {
      this.relations.delete(id);
    });

    const updated = diff.updated ?? [];
    updated.forEach(rel => {
      if (rel?.stratigraphie_uuid) {
        this.relations.delete(rel.stratigraphie_uuid);
      }
    });

    this.rebuildRelations();

    const additions = [...updated, ...(diff.added ?? [])];
    const errors: Array<{id: string; reason: ValidationErrorReason}> = [];
    additions.forEach(rel => {
      if (rel?.live === false) {
        return;
      }
      const result = this.applyRelation(rel);
      if (!result.ok) {
        const reason = (result as ValidationError).reason;
        errors.push({id: rel.stratigraphie_uuid, reason});
      }
    });

    if (errors.length) {
      this.rebuildRelations(); // rollback to consistent state
      const first = errors[0];
      throw new Error(`Diff application failed for ${first.id}: ${first.reason}`);
    }
  }

  stats(): { components: number; edges: number; nNodes: number } {
    return {
      components: this.dsu.getComponentCount(),
      edges: this.dag.getEdgeCount(),
      nNodes: this.indexer.size
    };
  }

  private ensureCapacity(): void {
    const size = this.indexer.size;
    this.dsu.ensureSize(size);
    this.dag.ensureCapacity(size);
  }

  private rebuildRelations(): void {
    const snapshot = Array.from(this.relations.values()).map(item => item.relation);
    this.reset();
    snapshot.forEach(rel => {
      if (rel?.live === false) {
        return;
      }
      const result = this.applyRelation(rel);
      if (!result.ok) {
        const reason = (result as ValidationError).reason;
        throw new Error(`Failed to rebuild relation ${rel.stratigraphie_uuid}: ${reason}`);
      }
    });
  }
}
