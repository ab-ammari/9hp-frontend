import {getObjectUuidPath, getTableDescription, tableDescription} from "../DataClasses/models/sync-obj-utilities";
import {IndexableType, Table} from "dexie";
import {first, Observable} from "rxjs";
import {returnObject, returnObjectList, syncObject} from "./db-utils";
import {ApiDbTable, ApiProjet, ApiSyncableObject, TagSystem} from "../../../shared";
import {observe} from "../util/utils";
import {commitToDB} from "./db-transactions";
import {UI} from "../util/ui";
import {filter, tap} from "rxjs/operators";
import {DB} from "./DB";

export class dbObject<T extends ApiSyncableObject> {
  readonly uuid_path: string;
  public readonly info: tableDescription;

  private tagSystem: TagSystem;

  constructor(public dexie_table: Table<T>, readonly table: ApiDbTable) {
    this.info = getTableDescription(table);
    this.uuid_path = getObjectUuidPath(table);

    let projet_uuid = UI.state.store.projet_uuid;
    if(DB.database.isReady)this.setTagSystem(projet_uuid);
    UI.state.onStoreChange.pipe(
      filter(ui => {
        if (ui.projet_uuid === projet_uuid) {
          return false;
        } else {
          projet_uuid = ui.projet_uuid;
          return true;
        }
      }),
      tap(ui => this.setTagSystem(ui.projet_uuid))
    ).subscribe();
  }
  private setTagSystem(project_uuid) {
    DB.database.projet.get(project_uuid).pipe(
      tap((proj: ApiProjet) => this.tagSystem = proj?.config?.tags?.find(tag => tag.table_name === this.info.obj_table)?.tag_system ?? null),
      first(),
    ).subscribe();
  }

  get(uuid): Observable<T> {
    return observe(returnObject(this.dexie_table, uuid, this.uuid_path));
  }

  save(object: T): Observable<Array<ApiSyncableObject>> {
    return commitToDB(object);
  }

/*  update(key: string, object: T): Observable<IndexableType> {
    return updateItem(this.dexie_table, object, key);
  }*/

  sync(object: T): Observable<IndexableType> {
    return syncObject(this.dexie_table, object);
  }

  list(): Observable<Array<T>> {
    return returnObjectList(this.dexie_table, this.uuid_path);
  }
}


