/// <reference lib="webworker" />
import {ApiStratigraphie} from "../objects/models/DbInterfaces";
import {StratigraphieValidator, ValidationResult} from "./validator";

export type StratigraphieWorkerRequest =
  | { id: number | string; type: "init"; nodes: string[]; relations: ApiStratigraphie[] }
  | { id: number | string; type: "diff"; diff: { added?: ApiStratigraphie[]; removed?: string[]; updated?: ApiStratigraphie[] } }
  | { id: number | string; type: "validate"; relation: ApiStratigraphie }
  | { id: number | string; type: "stats" }
  | { id: number | string; type: "reset" };

type WorkerResponse =
  | { id: number | string; ok: true; result: unknown }
  | { id: number | string; ok: false; error: string };

export const validator = new StratigraphieValidator();

function respond(message: StratigraphieWorkerRequest, payload: unknown, ok: boolean): WorkerResponse {
  return ok
    ? {id: message.id, ok: true, result: payload}
    : {id: message.id, ok: false, error: String(payload)};
}

export const createStratigraphieWorkerHandler = (scope: DedicatedWorkerGlobalScope) => (event: MessageEvent<StratigraphieWorkerRequest>) => {
  const message = event.data;
  try {
    switch (message.type) {
      case "init": {
        validator.initGraph(message.nodes ?? [], message.relations ?? []);
        scope.postMessage(respond(message, null, true));
        break;
      }
      case "diff": {
        validator.applyDiff(message.diff ?? {});
        scope.postMessage(respond(message, null, true));
        break;
      }
      case "validate": {
        const result: ValidationResult = validator.validateRelation(message.relation);
        scope.postMessage(respond(message, result, true));
        break;
      }
      case "stats": {
        scope.postMessage(respond(message, validator.stats(), true));
        break;
      }
      case "reset": {
        validator.reset();
        scope.postMessage(respond(message, null, true));
        break;
      }
      default:
        scope.postMessage(respond(message, `Unknown worker command ${(message as { type: string }).type}`, false));
        break;
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    scope.postMessage(respond(message, error, false));
  }
};

export function registerStratigraphieWorker(scope: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope): void {
  scope.onmessage = createStratigraphieWorkerHandler(scope);
}
