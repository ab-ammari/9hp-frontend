import {ApiDbTable, ApiSyncableObject} from "../../../../shared";
import {DB, dbStatus} from "../../Database/DB";
import {debounce, filter, share, skip, tap} from "rxjs/operators";
import {DatabaseChangeType, ICreateChange, IUpdateChange} from "dexie-observable/api";
import {BehaviorSubject, Observable, timer} from "rxjs";
import {IndexableType} from "dexie";
import {LOG, LoggerContext} from "ngx-wcore";
import {triggerChangeDetection} from "../../util/utils";
import {getTableDescription, tableDescription} from "./sync-obj-utilities";
import {dbLink} from "../../Database/db-link";
import {LinkUuid} from "../../Database/db-utils";

const CONTEXT: LoggerContext = {
  origin: 'dbBoundLink'
}

export class dbBoundLink<T extends ApiSyncableObject> {
  private store: BehaviorSubject<T> = new BehaviorSubject<T>(null);
  private readonly uuid_keys: {
    key_1: string,
    key_2: string
  };
  private uuid_1: LinkUuid;
  private uuid_2: LinkUuid;
  private created: number;

  public readonly info: tableDescription;
  constructor(private object: dbLink<T>, initObject: T = null) {
    this.info = object.info;
    this.uuid_keys = {
      key_1: object.info.uuid_paths[0],
      key_2: object.info.uuid_paths[1]
    };
    if (initObject) {
      this.store.next(initObject);
    }
    DB.database.status
      .pipe(filter(value => value === dbStatus.ready))
      .subscribe(() => {
        if (!initObject) {
          this.syncItem();
        }
      });
    DB.database.on_change.pipe(
      filter(value => {
        const info = getTableDescription(value.table as ApiDbTable);
        return (value.type === DatabaseChangeType.Create || value.type === DatabaseChangeType.Update)
          && (info.ref_table === this.object.table);
      }) // only new Objects are of interest
    ).subscribe((value: ICreateChange | IUpdateChange) => {
      LOG.debug.log({...CONTEXT, action: 'DB.database.on_change.pipe'}, this.object.table, value);
      const obj: T = value.obj;
      if (this.item && this.uuid_keys && obj) { // if object selected
        if (
          obj[this.uuid_keys.key_1] === this.item[this.uuid_keys.key_1]
          && obj[this.uuid_keys.key_2] === this.item[this.uuid_keys.key_2]
        ) { // if same object uuid
          if (obj.created > this.item.created) { // if newer object version or same object updated
            LOG.debug.log({
              ...CONTEXT,
              action: 'DB.database.on_changes',
              message: 'if newer object version or updated object'
            }, obj);
            this.store.next(obj);
          } else {
            LOG.debug.log({
              ...CONTEXT,
              action: 'DB.database.on_changes',
              message: 'Seems to be an older version for some reason'
            }, obj);
          }
        }
      }
    });
    this.onValueChange().pipe(
      debounce(() => timer(500)),
    ).subscribe(() => {
      triggerChangeDetection();
    })
  }

  get item(): T {
    return this.store.value;
  }

  onValueChange(): Observable<T> {
    return this.store?.asObservable().pipe(
      skip(1), /// BEhavior subject will always emit once when subscribed. so skip first value.
      share(), tap((val) =>  {

    }));
  }

  commit(newObj: T): Observable<Array<ApiSyncableObject>> {
    return this.object.save(newObj);
  }

  select(uuid1: LinkUuid, uuid2: LinkUuid, created: number): Observable<T> {
    this.uuid_1 = uuid1;
    this.uuid_2 = uuid2;
    this.created = created;
    return this.syncItem();
  }

  private syncItem(): Observable<T> {
    const sub = this.object.get(this.uuid_1, this.uuid_2, this.created);
    sub.subscribe(next => {
      this.store.next(next);
    });
    return sub;
  }


}

