import {ApiDbTable, ApiSyncableObject} from "../../../../shared";
import {BehaviorSubject, Observable, timer} from "rxjs";
import {DB, dbStatus} from "../../Database/DB";
import {debounce, filter, share, tap} from "rxjs/operators";
import {LOG, LoggerContext} from "ngx-wcore";
import {DatabaseChangeType, ICreateChange} from "dexie-observable/api";
import {triggerChangeDetection} from "../../util/utils";
import {UI} from "../../util/ui";
import {dbLink} from "../../Database/db-link";
import {dbBoundLink} from "./db-bound-link";
import {tableDescription} from "./sync-obj-utilities";

const CONTEXT: LoggerContext = {
  origin: 'dbBoundList'
}

export class dbBoundLinkList<T extends ApiSyncableObject> {
  private _orderBy: orderByType = "tag";
  set orderBy(type: orderByType) {
    this._orderBy = type;
    this.reloadList();
  }

  get orderBy(): orderByType {
    return this._orderBy;
  }

  get list(): Array<dbBoundLink<T>> {
    return this.store.value;
  }

  private store: BehaviorSubject<Array<dbBoundLink<T>>> = new BehaviorSubject<Array<dbBoundLink<T>>>([]);
  private readonly uuid_keys: {
    key_1: string,
    key_2: string
  };
  private projet_uuid: string;

  constructor(public object: dbLink<T>, public info: tableDescription) {
    this.uuid_keys = {
      key_1: object.info.uuid_paths[0],
      key_2: object.info.uuid_paths[1]
    };

    DB.database.status
      .pipe(filter(value => value === dbStatus.ready))
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
      filter(value => {
        return (value.type === DatabaseChangeType.Create || value.type === DatabaseChangeType.Update)
          && (value.obj.table === this.object.table); // only new objects of same table are of interest
      }) // only new Objects are of interest
    ).subscribe((value: ICreateChange) => {
      const obj: T = value.obj;
      LOG.debug.log({...CONTEXT, action: 'DB.database.on_changes', message: 'check list'}, this.list);
      if (this.list && obj) { // if object selected
        if (this.list.some(x =>
          (x.item[this.uuid_keys.key_1] === obj[this.uuid_keys.key_1])
          && (x.item[this.uuid_keys.key_2] === obj[this.uuid_keys.key_2])
        )) { // if object exists in list
          // dbBoundItems update themselves.
        } else { // is new Object, add to list
          const list = this.store.value ? [...this.store.value] : [];
          list.push(new dbBoundLink<T>(this.object, obj));
          LOG.debug.log({...CONTEXT, action: 'DB.database.on_changes', message: 'add new object'}, obj);
          this.store.next(this.sortList(list));
        }
      }
    });
    this.onValueChange().pipe(
      debounce(() => timer(500)),
    ).subscribe(() => {
      triggerChangeDetection();
    });
  }


  onValueChange(): Observable<Array<dbBoundLink<T>>> {
    return this.store.asObservable().pipe(share());
  }


  reloadList() {
    if (this.projet_uuid || this.object.table === ApiDbTable.projet) {
      this.object.list().subscribe(next => {
        this.store.next(this.sortList(this.generateBoundArray(next)));
      });
    } else {
      this.store.next(null);
    }
  }

  private generateBoundArray(arr: Array<T>): Array<dbBoundLink<T>> {
    const list: Array<dbBoundLink<T>> = new Array<dbBoundLink<T>>();
    arr.forEach(item => {
      const obj: dbBoundLink<T> = new dbBoundLink<T>(this.object, item);
      obj.select(
        {key: this.uuid_keys.key_1, uuid: item[this.uuid_keys.key_1]},
        {key: this.uuid_keys.key_2, uuid: item[this.uuid_keys.key_2]},
         item.created
      );
      // check if different version already exists.
      const index = list.findIndex(x => (x.item[this.uuid_keys.key_1] === item[this.uuid_keys.key_1] && x.item[this.uuid_keys.key_2] === item[this.uuid_keys.key_2]));
      if (index === -1) { // no other version found
        list.push(obj);
      } else {
        if (list[index].item.created < item.created) {
          list[index] = obj; // replace older version
        } else {
          // already newest version, do nothing
        }
      }

    });
    //LOG.debug.log({...CONTEXT, action: 'generateBoundArray'}, arr, list, this.uuid_path);
    return list;
  }

  private sortList(orig: Array<dbBoundLink<T>>): Array<dbBoundLink<T>> {
    let items = [];
    orig.forEach(x => items.push(x.item))
   // LOG.debug.log({...CONTEXT, action: 'sortList ' + this.object.info.label}, items);
    if (orig && orig.length > 0) {
      switch (this.orderBy) {
        case "created":
          return orig.sort((a, b) => a.item?.created - b.item?.created);
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
}


export type orderByType = 'tag' | 'created';
