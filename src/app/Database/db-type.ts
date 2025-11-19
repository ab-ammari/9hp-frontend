import {ApiDbTable, ApiSyncableObject, ApiSyncableType, ApiTypeCategory} from "../../../shared";
import {IndexableType, Table} from "dexie";
import {Observable} from "rxjs";
import {returnObject, returnObjectList, saveObject, syncObject} from "./db-utils";
import {map, tap} from "rxjs/operators";
import {LOG, LoggerContext} from "ngx-wcore";
import {observe} from "../util/utils";
import {bulkCommitToDB, commitToDB} from "./db-transactions";

const CONTEXT: LoggerContext = {
  origin: 'dbType'
}

export class dbType<T extends ApiSyncableType> {
  readonly uuid_path: string = 'type_uuid';

  constructor(public dexie_table: Table<T>, readonly table: ApiDbTable) {
  }

  get(uuid: string): Observable<T> {
    return observe(returnObject(this.dexie_table, uuid, this.uuid_path));
  }

  save(object: T): Observable<IndexableType> {
    return saveObject(this.dexie_table, object, 0);
  }

  commit(object: ApiSyncableObject[]): Observable<ApiSyncableObject[]> {
    return bulkCommitToDB(object);
  }

  sync(object: T): Observable<IndexableType> {
    return syncObject(this.dexie_table, object);
  }

  list(category: ApiTypeCategory): Observable<Array<T>> {
    LOG.debug.log({...CONTEXT, action: 'list ApiTypeCategory'}, category );

    return returnObjectList(this.dexie_table, this.uuid_path).pipe(
      tap((data) => {
        LOG.debug.log({...CONTEXT, action: 'list ApiTypeCategory'}, data, data.filter(item => item.type_category_uuid === category) );
      }),
      map(value => value.filter(item => item.type_category_uuid === category))
    );
  }
}

