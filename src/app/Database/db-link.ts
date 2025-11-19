import {ApiDbTable, ApiSyncableObject} from "../../../shared";
import {getTableDescription, tableDescription} from "../DataClasses/models/sync-obj-utilities";
import {IndexableType, Table} from "dexie";
import {Observable} from "rxjs";
import {LinkUuid, returnLink, returnLinkList, syncLink} from "./db-utils";
import {observe} from "../util/utils";
import {commitToDB} from "./db-transactions";

export class dbLink<T extends ApiSyncableObject> {
  public readonly info: tableDescription;

  constructor(public dexie_table: Table<T>, public table: ApiDbTable) {
    const info: tableDescription = getTableDescription(table);
    if (info.type === 'link') {
      this.info = info;
    } else {
      throw new Error('Wrong table type !!!!');
    }
  }

  get(uuid1: LinkUuid, uuid2: LinkUuid, created): Observable<T> {
    return observe(returnLink(this.dexie_table, uuid1, uuid2, created));
  }

  save(object: T ): Observable<Array<ApiSyncableObject>> {
    return commitToDB(object);
   }

/*
  update(key: string, object: T): Observable<IndexableType> {
    return updateItem(this.dexie_table, object, key);
  }
*/

  sync(object: T): Observable<IndexableType> {
    return syncLink(this.dexie_table, object);
  }

  list(): Observable<Array<T>> {
    return returnLinkList(this.dexie_table, this[this.info.uuid_paths[0]], this[this.info.uuid_paths[1]]);
  }
}
