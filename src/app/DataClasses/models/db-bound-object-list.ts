import {ApiDbTable, ApiSyncableObject} from "../../../../shared";
import {BehaviorSubject, Observable, timer} from "rxjs";
import {dbObject} from "../../Database/db-object";
import {DB, dbStatus} from "../../Database/DB";
import {debounce, debounceTime, distinct, filter, share, tap} from "rxjs/operators";
import {LOG, LoggerContext} from "ngx-wcore";
import {dbBoundObject} from "./db-bound-object";
import {IDatabaseChange, IDeleteChange} from "dexie-observable/api";
import {triggerChangeDetection} from "../../util/utils";
import {UI} from "../../util/ui";
import {tableDescription} from "./sync-obj-utilities";

const CONTEXT: LoggerContext = {
  origin: 'dbBoundList'
}

export class dbBoundObjectList<T extends ApiSyncableObject> {
  private _orderBy: orderByType = "tag";
  set orderBy(type: orderByType) {
    this._orderBy = type;
    this.reloadList();
  }

  get orderBy(): orderByType {
    return this._orderBy;
  }

  private _isReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  get isReady() {
    return this._isReady.value;
  }
  get onReady() {
    return this._isReady.asObservable().pipe(distinct(),filter(val => val));
  }

  get list(): Array<dbBoundObject<T>> {
    return this.store.value ?? [];
  }

  private _childLists: Map<ApiDbTable, Array<dbBoundObject<T>>> = new Map<ApiDbTable, Array<dbBoundObject<T>>>();

  private readonly store: BehaviorSubject<Array<dbBoundObject<T>>> = new BehaviorSubject<Array<dbBoundObject<T>>>([]);
  private uuid_map : Map<string, number> = new Map<string, number>(this.store.value.map((value, index, array) => {
    return [value.uuid, index];
  }));
  private readonly uuid_path: string;
  private projet_uuid: string;

  constructor(public object: dbObject<T>, public readonly info: tableDescription) {
    this.uuid_path = object.uuid_path;
    this._orderBy = object.table === ApiDbTable.projet ? 'newestFirst' : this._orderBy;
    this.store.pipe(
      debounceTime(100),
      tap((store) => {
        if (store) {
          this.uuid_map = new Map(store.map((value, index, array) => {
            return [value.uuid, index];
          }));
        } else {
          this.uuid_map = new Map([]);
        }

      })
    ).subscribe();
    DB.database.status
      .pipe(
        filter(value => value === dbStatus.ready)
      )
      .subscribe(() => this.reloadList());
    UI.state.onStoreChange.pipe(
      debounce(() => timer(100)),
      filter(value => {
        return (value.projet_uuid !== this.projet_uuid) && this.object.table !== ApiDbTable.projet
      }),
      tap((value) => {
        this.projet_uuid = value.projet_uuid;
        this.reloadList();
      })
    ).subscribe();
    DB.database.on_change.pipe(
      filter(value => value.table === this.info.ref_table),
      filter(value => {
        return (
           (
             value
             &&
             (
              (
              (value['oldObj'] && (value['oldObj']['projet_uuid'] === this.projet_uuid))
              ||
              (value['obj'] && (value['obj']['projet_uuid'] === this.projet_uuid))
               )
               ||
               (
                 this.info.ref_table === ApiDbTable.projet && value['obj'] && value['obj']
               )
             )
           )); // only new objects of same table are of interest
      }) // only new Objects are of interest
    ).subscribe((value: IDatabaseChange) => {
      LOG.debug.log({...CONTEXT, action: 'DB.database.onChange', message: this.uuid_path}, value);
      const obj: T = value['obj'];
      if (obj) {
        LOG.debug.log({...CONTEXT, action: 'DB.database.onChange new obj', message: 'check list'}, this.list);
        if (this.list && this.uuid_path) { // if object selected
          if (this.list.some(x => x.item[this.uuid_path] === obj[this.uuid_path])) { // if object exists in list
            // dbBoundItems update themselves.
          } else { // is new Object, add to list
            const list = this.store.value ? [...this.store.value] : [];
            list.push(new dbBoundObject<T>(this.object, obj.table, obj));
            LOG.debug.log({...CONTEXT, action: 'DB.database.on_changes', message: 'add new object'}, obj);
            const sortedList = this.sortList(list);
            this.store.next(sortedList);
            this.reloadChildList(sortedList);
          }
        } else {
          LOG.warn.log({...CONTEXT, action: 'on database change', message: 'new object but missing list or uuid path ?'}, this.list, this.uuid_path);
        }
      } else {
        /// deleted object
        const list = this.store.value ? [...this.store.value] : [];
        const i = list.findIndex(item => item.uuid === (value as IDeleteChange).oldObj[this.uuid_path] );
        list.splice(i, 1);
        this.store.next(list);
        this.reloadChildList(list);
      }

    });
    this.onValueChange().pipe(
      debounce(() => timer(500)),
    ).subscribe(() => {
      triggerChangeDetection();
    });
  }


  onValueChange(): Observable<Array<dbBoundObject<T>>> {
    return this.store.asObservable().pipe(share());
  }

  public childList(child: ApiDbTable): Array<dbBoundObject<T>> {
    return this._childLists.get(child);
  }

  reloadList() {
    this._isReady.next(  false);
    if (this.projet_uuid || this.object.table === ApiDbTable.projet) {
     // LOG.debug.log({...CONTEXT, action: 'reloadList'}, this.info);
      this.object.list().pipe(
      ).subscribe(next => {
        const newList = this.sortList(this.generateBoundArray(next));
        this.reloadChildList(newList);
        this.store.next(newList);
        this._isReady.next(  true);
      });
    } else {
      this._childLists.clear();
      this.store.next(null);
    }
  }

  reloadChildList(list: Array<dbBoundObject<T>>) {
    if ([ApiDbTable.document, ApiDbTable.echantillon, ApiDbTable.section].includes(this.info.ref_table)) {
      //  LOG.debug.log({...CONTEXT, action: 'reload childList'}, this.info, newList, this.info.child_tables);
      this.info.child_tables.forEach(child => {
        //  LOG.debug.log({...CONTEXT, action: 'reload childList, ADD'}, child, newList.filter(item => item.info.obj_table === child));
        this._childLists.set(child, list.filter(item => item.info.obj_table === child));
      });
      // LOG.debug.log({...CONTEXT, action: 'reload childList:DONE'}, this._childLists);
    }
  }

  private generateBoundArray(arr: Array<T>): Array<dbBoundObject<T>> {
    const list: Array<dbBoundObject<T>> = new Array<dbBoundObject<T>>();
    arr.forEach(item => {
      if (UI.state.admin_tools_visible || item.live) {
        if (!this.info.childType || this.info.uuid_paths[1] in item) { /// check if object is correct child entity
          const obj: dbBoundObject<T> = new dbBoundObject<T>(this.object, item.table, item);
          obj.select(item[this.uuid_path]);
          list.push(obj);
        } else {
          /// is different child
        }
      }

    });
    //LOG.debug.log({...CONTEXT, action: 'generateBoundArray'}, arr, list, this.uuid_path);
    return list;
  }

  private sortList(orig: Array<dbBoundObject<T>>): Array<dbBoundObject<T>> {
    let items = [];
    orig.forEach(x => items.push(x.item))
   // LOG.debug.log({...CONTEXT, action: 'sortList ' + this.info.label}, items);
    if (orig && orig.length > 0) {
      switch (this.orderBy) {
        case "oldestFirst":
          return orig.sort((a, b) => a.item?.created - b.item?.created);
        case "newestFirst":
          return orig.sort((a, b) => b.item?.created - a.item?.created);
        case "tag":
          return orig.sort((a, b) => {
            if (a.item && b.item) {
              if (a.item['tag'] && b.item['tag']) {
                //LOG.debug.log({...CONTEXT, action: 'sortList'}, a.item['tag'], b.item['tag']);
                return b.item['tag'].replace(/\D/g, '') - a.item['tag'].replace(/\D/g, '');
              } else if (a.item['tag'] && !b.item['tag']) {
                return 1;
              } else if (!a.item['tag'] && b.item['tag']) {
                return -1;
              } else {
                return 0
              }
            } else {
              return a.item?.created - b.item?.created;
            }
          });
        default:
          return orig.sort((a, b) => a.item?.created - b.item?.created);
      }
    } else return orig;

  }

  findByUuid(uuid: string): dbBoundObject<T> {
    return this.list[this.uuid_map.get(uuid)];
 //   return this.list.find(item => (item.item[this.info.uuid_paths[0]]) === uuid);
  }

}


export type orderByType = 'tag' | 'oldestFirst'| 'newestFirst';
