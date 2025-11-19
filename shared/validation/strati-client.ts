import {ApiStratigraphie} from "../objects/models/DbInterfaces";
import {ValidationResult} from "./validator";

type DiffPayload = { added?: ApiStratigraphie[]; removed?: string[]; updated?: ApiStratigraphie[] };

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

/**
 * Facade around the stratigraphie validation worker.
 */
export class StratigraphieClient {
  private requestId = 0;
  private readonly pending = new Map<number, PendingRequest>();

  constructor(private readonly worker: Worker) {
    this.worker.addEventListener("message", this.handleMessage);
  }

  async init(nodes: string[], relations: ApiStratigraphie[]): Promise<void> {
    await this.call("init", { nodes, relations });
  }

  async applyDiff(diff: DiffPayload): Promise<void> {
    await this.call("diff", { diff });
  }

  async validateRelation(relation: ApiStratigraphie): Promise<ValidationResult> {
    return this.call("validate", { relation }) as Promise<ValidationResult>;
  }

  async stats(): Promise<{ components: number; edges: number; nNodes: number }> {
    return this.call("stats", {}) as Promise<{ components: number; edges: number; nNodes: number }>;
  }

  async reset(): Promise<void> {
    await this.call("reset", {});
  }

  terminate(): void {
    this.worker.removeEventListener("message", this.handleMessage);
    this.worker.terminate();
    this.pending.forEach(({ reject }) => reject(new Error("Worker terminated")));
    this.pending.clear();
  }

  private call(type: "init" | "diff" | "validate" | "stats" | "reset", payload: Record<string, unknown>): Promise<unknown> {
    const id = this.requestId++;
    const message = { id, type, ...payload };
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage(message);
    });
  }

  private handleMessage = (event: MessageEvent<{ id: number; ok: boolean; result?: unknown; error?: string }>): void => {
    const { id, ok, result, error } = event.data;
    const entry = this.pending.get(id);
    if (!entry) {
      return;
    }
    this.pending.delete(id);
    if (ok) {
      entry.resolve(result);
    } else {
      entry.reject(new Error(error ?? "Unknown worker error"));
    }
  };
}
