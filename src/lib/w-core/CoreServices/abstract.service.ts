import {WorkerServicePrototype} from './worker.service';
import {LOG, LoggerContext} from "../utils/logger";
import {ActionPrototype} from "wcore-shared";

const CONTEXT: LoggerContext = {
  origin: 'WCOR3',
  action: 'AbstractService'
};

export abstract class AbstractService {


  protected constructor(protected w: WorkerServicePrototype) {

  }

  public init(name: string) {
    this.w.availableServices.add(name);
  }

  linkTriggers(triggers: Array<Trigger<unknown, unknown>>) {
    for (const trigger of triggers) {
      LOG.info.log({...CONTEXT, message: 'Linking trigger'}, trigger.event.name(), trigger.callback);
      this.w.on(trigger.event).pipe().subscribe(
        (next) => {
          trigger.callback(next as unknown);
        }
      );
    }
  }
}

export class Trigger<T, K> {
  constructor(
    public readonly event: ActionPrototype<T, K>,
    public readonly callback: (payload: T) => void) {
  }
}

