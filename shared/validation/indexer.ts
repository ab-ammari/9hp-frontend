import {ApiStratigraphie} from "../objects/models/DbInterfaces";

type Endpoint = {
  anterior?: number | null;
  posterior?: number | null;
};

/**
 * Assigns dense numeric identifiers to stratigraphie endpoints (US/FAIT).
 * Provides helpers to extract endpoint indices for any relation.
 */
export class NodeIndexer {
  private readonly idByKey = new Map<string, number>();
  private readonly keyById: string[] = [];

  get size(): number {
    return this.keyById.length;
  }

  /**
   * Returns the numeric identifier associated with the given key,
   * creating a new one when needed.
   */
  getOrCreateId(key: string): number {
    if (this.idByKey.has(key)) {
      return this.idByKey.get(key);
    }
    const id = this.keyById.length;
    this.idByKey.set(key, id);
    this.keyById.push(key);
    return id;
  }

  hasKey(key: string | null | undefined): boolean {
    if (!key) {
      return false;
    }
    return this.idByKey.has(key);
  }

  getKey(id: number): string | undefined {
    return this.keyById[id];
  }

  /**
   * Returns the endpoint indices for a relation.
   */
  getRelationEndpoints(relation: ApiStratigraphie): Endpoint {
    const anterior = relation.us_anterieur ?? relation.fait_anterieur ?? null;
    const posterior = relation.us_posterieur ?? relation.fait_posterieur ?? null;
    return {
      anterior: anterior ? this.getOrCreateId(anterior) : null,
      posterior: posterior ? this.getOrCreateId(posterior) : null
    };
  }

  /**
   * Clears every mapping, resetting the indexer to an empty state.
   */
  reset(): void {
    this.idByKey.clear();
    this.keyById.length = 0;
  }
}
