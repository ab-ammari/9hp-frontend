import {Injectable, Injector, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';
import {WCoreConfig} from '../CoreDataStore/w-core-config';
import {CoreServiceobject} from '../CoreDataStore/core-service-object';
import {AbstractService} from './abstract.service';
import {WorkerServicePrototype} from './worker.service';
import {takeUntil} from 'rxjs/operators';
import {SystemActions} from '../system-actions';
import {LOG, LoggerContext} from "../utils/logger";
import {ActionPrototype} from "wcore-shared";

const CONTEXT: LoggerContext = {
  origin: 'WCOR3',
  action: 'WCoreService',
};

@Injectable()
export class WCoreService implements OnDestroy {


  private services: {
    [key: string]: CoreServiceobject<AbstractService>, // the Objects of the service that OxyCore needs to Manage
  } = {};

  private $subscriber = new Subject();

  private w: WorkerServicePrototype;

  constructor(
    private injector: Injector,
  ) {
  }

  ngOnDestroy() {
    this.$subscriber.next(null);
  }

  initCore(serviceList: service_list<unknown, unknown>, workerService: unknown) {
    this.w = workerService as WorkerServicePrototype;
    this.setupServices(serviceList);
    LOG.info.log({...CONTEXT, action: 'initCore'});
    for (const item of serviceList) {
      LOG.info.log({...CONTEXT, action: 'initCore', message: 'importService'}, item.name);
      this.w.on(item.initOn).pipe(takeUntil(this.$subscriber))
        .subscribe(next => {
          this.services[item.name].service.init(item.name);
        });
    }
    // dispatch the init event to launch services and other actions on startup of the app
    this.w.trigger(SystemActions.init);
  }



  private getService() {
    return this.services;
  }

  private resetServices<X, Y>(serviceList: service_list<X, Y>) {
    LOG.info.log({...CONTEXT, action: 'initCore', message: 'RESET'});

    this.$subscriber.next(null);
    this.initCore(serviceList, this.w);

  }

  private setupServices(serviceList: service_list<unknown, unknown>) {
    const config = new WCoreConfig(this.injector, serviceList);
    LOG.info.log({...CONTEXT, action: 'setupServices'}, serviceList);
    this.services = config.services;
  }


}

export interface ServiceList {
  list: Array<{ name: string, service: any, initOn: number }>;
}

export type service_list<X, Y> = Array<CoreService<X, Y>>;
export type action_list<X, Y> = Array<ActionPrototype<X, Y>>;

export class CoreService<X, Y> {
  constructor(public name: string, public service: unknown, public initOn: ActionPrototype<X, Y>) {
  }
}
