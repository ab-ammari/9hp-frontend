import {EMPTY, merge, Observable, Subject} from 'rxjs';
import {catchError, mergeMap, share, tap} from 'rxjs/operators';
import {SystemActions} from '../system-actions';
import {NetworkConfig, networkMode, NetworkStatus, WCoreNetwork} from '../CoreNetworkingTools/Network';
import {LOG, LoggerContext} from "../utils/logger";
import {ActionIQ, ActionPrototype, ApiIQ, ApiIQError} from "wcore-shared";


const CONTEXT: LoggerContext = {
  origin: 'WCOR3',
  action: 'WorkerService',
};

const boolToNum = bool => bool ? 1 : 0;


export abstract class WorkerServicePrototype {
  /**
   * new and improved events
   * @experimental
   * @description Candidate for V3 to replace serviceEvents
   */
  private coreEventReferenceList: Array<Subject<unknown>> = [];

  protected dataStore;

  private privateAvailableServices: Set<string> = new Set<string>();

  private networkManager: WCoreNetwork = new WCoreNetwork();

  get networkStatus(): { rest: NetworkStatus, socket: NetworkStatus } {
    const rest: NetworkStatus = boolToNum(this.networkManager.config.mode.has('rest')) + boolToNum(this.networkManager.restOnline);
    const socket: NetworkStatus = boolToNum(this.networkManager.config.mode.has('socket')) + boolToNum(this.networkManager.socketOnline);
    return {rest, socket};
  }

  get networkActivity(): Array<ActionIQ> {
    return this.networkManager.networkActivity;
  }

  get networkConfig(): NetworkConfig {
    return this.networkManager.config;
  }

  public get availableServices(): Set<string> {
    return this.privateAvailableServices;
  }

  protected constructor() {
    this.resetCoreEventReferenceList();
    this.on(SystemActions.initRemote).pipe(
      tap((value) => {
        this.networkManager.setConfig(value);
      })
    ).subscribe();
    this.networkManager.incoming().pipe(
      tap((next) => {
        // LOG.info.log({...CONTEXT, action: 'INCOMING IQ'}, next);
        this.handleincomingIQ(next);
      })
    ).subscribe();
  }

  protected handleincomingIQ(next: unknown) {
    this.trigger(SystemActions.NETWORK_IN, next);
    const value: ApiIQ<unknown, unknown> = next as ApiIQ<unknown, unknown>;
    const error: ApiIQError<unknown> = next as ApiIQError<unknown>;
    if (value.payload) {
      this.trigger(value.event.toString(), next);
    }
    if (error.error) {
      // LOG.debug.log({...CONTEXT, action: 'INCOMING IQ', message: 'IQ-ERROR'}, next);
      this.trigger(SystemActions.NETWORK_ERROR, next);
    }
    if (!error.error && !value.payload) {
      // LOG.debug.log({...CONTEXT, action: 'INCOMING IQ', message: 'UNKNOWN ERROR'}, next);
      this.trigger(SystemActions.Error, next);
    }
  }

  private resetCoreEventReferenceList() {
    for (let i = 0; i <= ActionPrototype.StaticActionClassEnumerator; i++) {
      // console.log('Adding new key to eventList ::: ', i);
      if (this.coreEventReferenceList[i]
        && this.coreEventReferenceList[i].observers
        && this.coreEventReferenceList[i].observers.length > 0) {
        //   LOG.debug.log('[WokerService resetCoreEventRefList ::: ]', this.coreEventReferenceList[i]);
      } else {
        this.coreEventReferenceList[i] = new Subject<unknown>();
      }
    }
    LOG.info.log({...CONTEXT, message: 'added keys from a total of ' + ActionPrototype.StaticActionClassEnumerator});
  }

  private checkCoreEventReferenceList(key: number) {
    if (!(this.coreEventReferenceList && this.coreEventReferenceList[key])) {
      LOG.warn.log({...CONTEXT, action: 'RefListCheck', message: 'key not found'}, key, this.coreEventReferenceList);
      this.resetCoreEventReferenceList();
    }
  }

  /**
   * @description Access to global data repository. considered unique shared truth
   */
  data(): unknown {
    return this.dataStore.data();
  }


  /**
   * @description send an Action with APIIQ
   * @deprecated use network instead !
   */
  socket<T>(event: ActionPrototype<ApiIQ<T, unknown>, unknown>, request: T, id: string = new Date().getTime().toString()) {
    this.network(event, request, {
      preferedNetwork: 'socket'
    });
  }

  /**
   * @description send an Action with APIIQ to the api
   */
  network<T, K>(event: ActionPrototype<ApiIQ<T, K>, unknown>,
                request: T,
                config?: { id?: string, preferedNetwork?: networkMode }
  ): Observable<ApiIQ<T, K>> {
    const iq: ApiIQ<T, K> = {
      id: config?.id ?? new Date().getTime().toString() + Math.random().toString(),
      event: event.name(),
      request
    };
    this.trigger(SystemActions.NETWORK_OUT, iq);
    return this.networkManager.sendOnNetwork<T, K>(iq, config?.preferedNetwork);
  }


  /**
   * @description should replace emit and work with the new on() subscriber
   */
  trigger<T, N>(trigger: ActionPrototype<T, N> | string, data: T = null, error: N = null): ActionPrototype<T, N> | string {
    let key: number;
    if (trigger && (trigger as ActionPrototype<T, N>).getKey) {
      key = (trigger as ActionPrototype<T, N>).getKey();
    } else {
      key = ActionPrototype.getKeyFromName(trigger as string, SystemActions.unknown.getKey());
    }

    this.checkCoreEventReferenceList(key);

    if (this.coreEventReferenceList && this.coreEventReferenceList[key]) {
      if (data) {
        // ApiUtilities.log('WCOR3 :::: ', 'TRIGGER ::: ', trigger.toString(), 'data : ', data);
        LOG.info.log({
          ...CONTEXT, action: trigger.toString(), message: '::: KEY ::: ' + key,
        }, data);
        this.coreEventReferenceList[key].next(data);
      } else if (error) {
        // ApiUtilities.log('WCOR3 :::: ', 'TRIGGER ::: ', trigger.toString(), 'error : ', error);
        LOG.error.log({
          ...CONTEXT, action: trigger.toString(), message: 'ERROR',
        }, error);
        this.coreEventReferenceList[key].next(error);
      } else {
        // ApiUtilities.log('WCOR3 :::: ', 'TRIGGER ::: ', trigger.toString(), 'No Data and No Error Found !');
        LOG.info.log({
          ...CONTEXT, action: trigger.toString(), message: '::: KEY ::: ' + key,
        });
        this.coreEventReferenceList[key].next(null);
      }
    } else {
      // ApiUtilities.log('WCOR3 :::: ', 'TRIGGER ::: event not found ', event, this.coreEventReferenceList);
      LOG.error.log({
        ...CONTEXT, action: 'TRIGGER', message: 'event not found',
      }, key, this.coreEventReferenceList);
    }

    return trigger;
  }

  /**
   * @description should replace listenForEvent with more complete event informations attached to each event.
   * @param event: ActionPrototype
   */
  on<T, N>(event: ActionPrototype<T, N>): Observable<T> {

    this.checkCoreEventReferenceList(event.getKey());

    LOG.info.log({...CONTEXT, action: 'ON', message: event.toString() + ' ' + event.getKey()});
    if (this.coreEventReferenceList && event && this.coreEventReferenceList[event.getKey()]) {
      return this.coreEventReferenceList[event.getKey()].asObservable().pipe(share()) as Observable<T>;
    } else {
      LOG.error.log({...CONTEXT, action: 'ON', message: 'event not found'}, event, this.coreEventReferenceList);
      return null;
    }
  }


  /**
   * @description Subscribe to any trigger of a particular Action list
   * @param list: K extends ActionPrototype
   */
  onAnyOfList(list: ActionPrototype<unknown, unknown>): never {
    // todo implement onList method
    throw new Error(('TODO'));
  }

  /**
   * @description Subscribe to any trigger
   */
  onAny(): Observable<unknown> {
    return merge(this.coreEventReferenceList).pipe(
      mergeMap(value => value.pipe(catchError((err) => {
        console.error(err);
        return EMPTY;
      }))),
      share());
  }

  /**
   * @description Subscribe to any trigger in the provided list
   */
  onAnyOf(events: Array<ActionPrototype<unknown, unknown>>): Observable<unknown> {
    events.forEach((event) => {
      this.checkCoreEventReferenceList(event.getKey());
    });
    return merge(this.coreEventReferenceList.filter(
      (x, i) => events.filter(
        y => y.getKey() === i
      ).length > 0)
    ).pipe(
      mergeMap(value => value.pipe(catchError((err) => {
        console.error(err);
        return EMPTY;
      }))),
      share());
  }

}
