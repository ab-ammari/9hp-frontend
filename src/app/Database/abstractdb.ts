import Dexie from "dexie";
import {Observable, Subject} from "rxjs";
import {IDatabaseChange} from "dexie-observable/api";
import {LOG, LoggerContext} from "ngx-wcore";
import {share} from "rxjs/operators";


const CONTEXT: LoggerContext = {
  origin: 'Abstractdb'
}

export class Abstractdb extends Dexie {

  /**
   * Events
   */
  private readonly onPopulate: Subject<void> = new Subject<void>();

  get on_populate(): Observable<void> {
    return this.onPopulate.asObservable();
  }

  private readonly onReady: Subject<Dexie> = new Subject<Dexie>();

  get on_ready(): Observable<Dexie> {
    return this.onReady.asObservable();
  }

  private readonly onVersionchange: Subject<IDBVersionChangeEvent> = new Subject<IDBVersionChangeEvent>();

  get on_versionchange(): Observable<IDBVersionChangeEvent> {
    return this.onVersionchange.asObservable();
  }

  private readonly onChanges: Subject<IDatabaseChange[]> = new Subject<IDatabaseChange[]>();

  get on_changes(): Observable<IDatabaseChange[]> {
    return this.onChanges.asObservable().pipe(share());
  }

  private readonly onBlocked: Subject<IDBVersionChangeEvent> = new Subject<IDBVersionChangeEvent>();

  get on_blocked(): Observable<IDBVersionChangeEvent> {
    return this.onBlocked.asObservable();
  }

  private readonly onClose: Subject<Event> = new Subject<Event>();

  get on_close(): Observable<Event> {
    return this.onClose.asObservable();
  }

  constructor(DbName: string) {
    super(DbName);
    // LOG.debug.log({...CONTEXT, action: 'Abstractdb:::constructor'});
    this.on('populate', () => {
      this.onPopulate.next(undefined);
      LOG.debug.log({...CONTEXT, action: 'onPopulate'});
    });
    this.on('ready', (event) => {
      this.onReady.next(event);
      LOG.debug.log({...CONTEXT, action: 'onReady'}, event);
    });
    this.on('changes', (event) => {
      this.onChanges.next(event);
      // LOG.debug.log({...CONTEXT, action: 'onChanges'}, event);
    });
    this.on('versionchange', (event) => {
      this.onVersionchange.next(event);
      LOG.debug.log({...CONTEXT, action: 'onVersionchange'}, event);
    });
    this.on('blocked', (event) => {
      this.onBlocked.next(event);
      LOG.debug.log({...CONTEXT, action: 'onBlocked'}, event);
    });
    this.on('close', (event) => {
      this.onClose.next(event);
      LOG.debug.log({...CONTEXT, action: 'onClose'}, event);
      this.open();
    });


  }

}
