import {ApiDbTable, ApiSyncableObject} from "../../../../shared";
import {dbObject} from "../../Database/db-object";
import {DB, dbStatus} from "../../Database/DB";
import {debounce, delay, distinct, filter, map, mapTo, mergeMap, share, tap} from "rxjs/operators";
import {DatabaseChangeType, ICreateChange, IUpdateChange} from "dexie-observable/api";
import {BehaviorSubject, first, Observable, of, timer} from "rxjs";
import {LOG, LoggerContext} from "ngx-wcore";
import {observe, triggerChangeDetection, triggerToast} from "../../util/utils";
import {getTableDescription, tableDescription} from "./sync-obj-utilities";
import {v4} from "uuid";


const CONTEXT: LoggerContext = {
  origin: 'dbBoundItem'
}

export class dbBoundObject<T extends ApiSyncableObject> {
  private store: BehaviorSubject<T> = new BehaviorSubject<T>(null);
  readonly uuid_path: string;
  public uuid: string;
  public info: tableDescription;

  private readonly ongoingActivity: BehaviorSubject<Set<string>> = new BehaviorSubject(new Set<string>([]));
  private addActivity(tag: string) {
    const set: Set<string> = new Set<string>(this.ongoingActivity.value);
    set.add(tag);
    this.ongoingActivity.next(set);
  }
  private removeActivity(tag: string) {
    const set: Set<string> = new Set<string>(this.ongoingActivity.value);
    set.delete(tag);
    this.ongoingActivity.next(set);
  }
  get onActivity() {
    return this.ongoingActivity.asObservable();
  }

  private _Ready: BehaviorSubject<boolean> = new BehaviorSubject(false);
  get isReady(){
    return this._Ready.value;
  }
  get onReady() {
    return this._Ready.asObservable().pipe(distinct(),filter(val => val));
  }

  constructor(private object: dbObject<T>, private table: ApiDbTable, initObject: T = null) {
    this.info = getTableDescription(table);
    // LOG.debug.log({...CONTEXT, action: 'constructor'}, this.info.ref_table);
    this.uuid_path = object.uuid_path;
    if (initObject) {
      this.store.next(initObject);
      this.uuid = initObject[this.uuid_path];
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
        if ((value.type === DatabaseChangeType.Create || value.type === DatabaseChangeType.Update)) {
          //   LOG.debug.log({...CONTEXT, action: value.type + ' on_change'}, value.table, filter_table, value);
          return (value.table === this.info.ref_table);
        } else {
          return false;
        }

      }) // only new Objects are of interest
    ).subscribe((value: ICreateChange | IUpdateChange) => {
      //  LOG.debug.log({...CONTEXT, action: filter_table + 'on_change'}, value, this.info);
      const obj: T = value.obj;
      if (this.item && this.uuid_path && obj) { // if object selected
        if (obj[this.uuid_path] === this.item[this.uuid_path]) { // if same object uuid
          if (obj.created >= this.item.created) { // if newer object version or same object updated
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
    return this.store?.asObservable().pipe(share());
  }

  commit(newObj: T): Observable<Array<ApiSyncableObject>> {
    const tag: string = v4();
    this.addActivity(tag)
    return this.object.save(newObj).pipe(
      tap({
        complete: () => {this.removeActivity(tag)},
        error: err => {this.removeActivity(tag)}}
      ),
      delay(100) // add delay so data has time to propagate after creation
    );
  }

  select(uuid: string): Observable<T> {
    this.uuid = uuid;
    return this.syncItem();
  }

  getAvailableVersions(uuid: string = this.uuid): Observable<Array<T>> {
    return observe(this.object.dexie_table.where({[this.uuid_path]: uuid}).reverse().sortBy('created'));
  }

  discard_draft() {
    if (this.item.draft || this.item.error) {
      return observe(this.object.dexie_table.where({[this.uuid_path]: this.uuid, created: this.item.created}).delete()).pipe(tap( () => {
        this.syncItem();
      }), map(() => true));
    } else {
      LOG.error.log({...CONTEXT, action: 'discard_draft', message: 'can\'t discard live item !!'}, this.item);
      return of(false)
    }
  }


  private syncItem(): Observable<T> {
    const sub = this.object.get(this.uuid);
    sub.subscribe(next => {
      if (next) {
        this.info = getTableDescription(next.table);
      } else {
        this.info = getTableDescription(this.table);
      }

      this.store.next(next);
      this._Ready.next(true);
    });
    return sub;
  }


}
