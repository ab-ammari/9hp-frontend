
import {IndexableType, Table} from "dexie";
import {Observable} from "rxjs";
import {UI} from "../util/ui";
import {ApiDbTable, ApiSyncableFile} from "../../../shared";
import {observe} from "../util/utils";
import {mergeMap, tap} from "rxjs/operators";

export class dbFile {

  constructor(public dexie_table: Table<ApiSyncableFile>) {

  }

  get(uuid): Observable<ApiSyncableFile> {
    return observe(this.dexie_table.get(uuid));
  }

  save(file: ApiSyncableFile): Observable<IndexableType> {
    return observe(this.dexie_table.add(file));
  }

/*  update(uuid: string, file: ApiSyncableFile): Observable<IndexableType> {
    return observe(this.dexie_table.get(uuid)).pipe(
      mergeMap((value) => {
        if (value) {
          return observe(this.dexie_table.update(uuid, file));
        } else {
          return this.save(file);
        }
      })
    );
  }*/

  sync(file: ApiSyncableFile): Observable<IndexableType> {
    return observe(this.dexie_table.put(file));
  }

  list(): Observable<Array<ApiSyncableFile>> {
    return observe(this.dexie_table.where({projet_uuid: UI.state.store.projet_uuid}).toArray()).pipe(tap(value => console.log(value, UI.state.store.projet_uuid)));
  }
}

