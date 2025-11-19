import {ApiDbTable, ApiSyncableObject, ApiSyncableObjectIndex, ApiSyncableType} from "../../../../shared";
import {UI} from "../../util/ui";
import {DB} from "../../Database/DB";
import {LOG, LoggerContext} from "ngx-wcore";
import {forkJoin, Observable, of} from "rxjs";
import {map, share, switchMap, tap} from "rxjs/operators";
import {observe} from "../../util/utils";
import {Table} from "dexie";
import {dbObject} from "../../Database/db-object";

const CONTEXT: LoggerContext = {
  origin: 'syncObjUtilities'
}

export function checkIndex(): Observable<Array<ApiSyncableObjectIndex>> {
//  LOG.debug.log({...CONTEXT, action: 'checkIndex'});
  const subs: Array<Observable<ApiSyncableObjectIndex>> = [];
  DB.database.project_index.index?.forEach(index => {
    index.index?.forEach(item => {
      if ([
        ApiDbTable.type_category,
        ApiDbTable.projet_user,
        ApiDbTable.projet,
        ApiDbTable.user_access,
        ApiDbTable.us_sous_division,
        ApiDbTable.user,
        ApiDbTable.us_construite_materiel
      ].includes(item.table)) {
        return; // skip because sub_objects or external objects
      }
      const info = getTableDescription(item.table);
      let db: dbObject<ApiSyncableObject>;
      let key: string;
      if (info.childType) {
        db = DB.database[item.table.split('_')[0]];
        key = info.uuid_paths[0];
      } else {
        key = item.key;
        db = DB.database[item.table];
      }


      //  LOG.debug.log({...CONTEXT, action: 'checkIndex'}, item, info);
      if (db) {
        subs.push(observe(db?.dexie_table
          .where([key, 'created']).equals([item.value, item.created]).filter(x => !x.draft).count()).pipe(
          map((count) => {
            if (count === 0) {
              //   LOG.debug.log({...CONTEXT, action: 'checkIndex', message: 'missing item : '}, item);
              return item;
            } else {
              //  LOG.debug.log({...CONTEXT, action: 'checkIndex', message: 'item has been found: '}, item);
              return null;
            }
          })
        ));
      } else {
        // skip
      }
    });
  });
  let result = forkJoin<ApiSyncableObjectIndex[]>(subs).pipe(
    map((list) => {
      return list.filter(x => x); // clean list
    }),
    tap((itemlist) => {
      if (itemlist.length > 0) {
        LOG.debug.log({
          ...CONTEXT,
          action: 'checkIndex',
          message: 'missing items found'
        }, itemlist);
      }
    }), share());
  result.subscribe();
  return result;
}

export function retrieveReferenceProject<T extends ApiSyncableObject>(obj: T): Observable<string> {
  if (obj['projet_uuid']) {
    return of(obj['projet_uuid'] as string);
  }
  const info = getTableDescription(obj.table);
  let ref_uuid: string;
  switch (info.type) {
    case "link":
      ref_uuid = info.uuid_paths[0]; // need to retrieve reference obj to find project
      const table: ApiDbTable = ref_uuid.split('_')[0] as ApiDbTable;
      DB.database[table].get(obj[ref_uuid]).pipe(
        switchMap((value, index) => {
          return retrieveReferenceProject(value as ApiSyncableObject);
        })
      );
      break;
    case "type": // types don't have a reference Project
      return of(null);
    case "object":
      ref_uuid = info.uuid_paths[0]; /// either secteur, US or contenant
      if (obj['secteur_uuid']) {
        return DB.database.secteur.get(obj['secteur_uuid']).pipe(
          switchMap((secteur, index) => {
            return of(secteur.projet_uuid);
          })
        );
      } else if (obj['us_uuid']) { // c'est un echantillon
        return DB.database.us.get(obj['us_uuid']).pipe(
          switchMap((us, index) => {
            return DB.database.secteur.get(us.secteur_uuid).pipe(
              switchMap((secteur, index) => {
                return of(secteur.projet_uuid);
              })
            );
          })
        );
      } else if (obj['contenant_uuid']) { // c'est un mouvement ?
        return DB.database.contenant.get(obj['contenant_uuid']).pipe(
          switchMap((contenant, index) => {
            return of(contenant.projet_uuid);
          })
        );
      }
  }
  LOG.debug.log({...CONTEXT, action: 'retrieveReferenceProject', message: 'No result ? How did we get here !?!??!'});
  return of(null);
}

/**
 * Filters the original list based on the selected project.
 *
 * @param {ApiDbTable} table - The API database table.
 * @param {Array<ApiSyncableObject | ApiSyncableType>} originalList - The original list of objects to filter.
 * @returns {Array<ApiSyncableObject | ApiSyncableType>} - The filtered list.
 */
export function filterForSelectedProject<T extends ApiSyncableObject | ApiSyncableType>(table: ApiDbTable, originalList: Array<T>): Array<T> {
  const info = getTableDescription(table);
  if (info.type !== 'type' && UI.state.store.projet_uuid && table !== ApiDbTable.projet && table !== ApiDbTable.user) {
    return originalList.filter(obj => (obj as ApiSyncableObject).projet_uuid === UI.state.store.projet_uuid);
  } else if (info.type === 'type') {
    return originalList.filter(obj => (obj as ApiSyncableType).projet_uuid === UI.state.store.projet_uuid || (obj as ApiSyncableType).projet_uuid === null);
  } else {
    LOG.debug.log({...CONTEXT, action: 'filterForSelectedProject - no selected Project'});
    return originalList;
  }

}

/**
 * Generates a new list containing unique versions of objects based on a specified unique identifier path.
 * Each object in the original list will be compared by the unique identifier,
 * and only the latest version of an object with the same unique identifier will be included in the result list.
 *
 * @param originalList - The original list of objects to be processed.
 * @param uuid_path - The unique identifier path used to compare objects.
 * @returns The new list containing unique versions of objects.
 */
export function generateUniqueVersionObjectList<T extends ApiSyncableObject | ApiSyncableType>(originalList: Array<T>, uuid_path: string): Array<T> {
  const list: Array<T> = [];
  // LOG.debug.log({...CONTEXT, action: 'generateUniqueVersionObjectList : TYPE '}, uuid_path);
//  LOG.debug.log({...CONTEXT, action: 'generateUniqueVersionObjectList : original'}, originalList.map(x => new Date(x.created)));

  originalList.forEach(item => {
    const index = list.findIndex((x) => x[uuid_path] === item[uuid_path]);
    const obj = list[index];
    if (obj) {
      // Priorité: draft = false > draft = true, puis par timestamp
      const shouldReplace = item.draft === false && obj.draft === true 
        ? true 
        : item.created > obj.created;
      
      if (shouldReplace) {
        list[index] = item; // overwrite ref with newer version of object
      } else {
        LOG.debug.log({...CONTEXT, action: 'generateUniqueVersionObjectList', message: 'ref already has newer version'});
        // ref already has newer version
      }
    } else {
      list.push(item); // Object not available yet. Add to list.
    }
  });
  // LOG.debug.log({...CONTEXT, action: 'generateUniqueVersionObjectList: result'}, list.map(x => new Date(x.created)));

  return list;
}

export function generateUniqueVersionLinkList<T extends ApiSyncableObject>(originalList: Array<T>, uuid_path1: string, uuid_path2: string) {
  const list: T[] = [];
  originalList.forEach(item => {
    const index = list.findIndex((x) => (x[uuid_path1] === item[uuid_path1] && x[uuid_path2] === item[uuid_path2]));
    if (index >= 0) {
      // Priorité: draft = false > draft = true, puis par timestamp
      const shouldReplace = item.draft === false && list[index].draft === true 
        ? true 
        : item.created > list[index].created;
      
      if (shouldReplace) {
        list[index] = item; // overwrite ref with newer version of object
      } else {
        // ref already has newer version
      }
    } else {
      list.push(item); // Object not available yet. Add to list.
    }
  });
  return list;
}


export const getObjectUuidPath = (table: ApiDbTable) => {
  return getTableDescription(table).uuid_paths[0];
}

export const getLinkUuidPath = (table: ApiDbTable) => {
  return getTableDescription(table).uuid_paths;
}

export const getTypeUuidPath = (table: ApiDbTable) => {
  return getTableDescription(table).uuid_paths[0];
}

export function getChildTables(table: ApiDbTable): Array<ApiDbTable> {
  const children: Array<ApiDbTable> = [];
  Object.values(ApiDbTable).forEach(t => {
    if (
      !t.includes('type')  // types don't have children
      && !t.includes('link')  // links don't have children
      && t !== table // this is a parent
      && t.split('_')[0] === table // this is a child
    ) {
      children.push(t);
    }
  });
  return children;
}

export function getTableDescription(table: ApiDbTable): tableDescription {
  if (!table) {
    return null;
  }
  const split_table: Array<string> = table.split('_');

  if (table === ApiDbTable.type) { // type
    return {
      type: ApiDbTable.type,
      uuid_paths: ['type_uuid'],
      ref_table: table,
      obj_table: table,
      label: 'type'
    };
  } else if (table.includes('link')) { // link
    return {
      type: "link",
      linked_tables: [
        split_table[1] as ApiDbTable,
        split_table[2] as ApiDbTable
      ],
      uuid_paths: [
        split_table[1] + '_uuid',
        split_table[2] + '_uuid'
      ],
      ref_table: table,
      obj_table: table,
      label: table.replace('link_', '')
    };
  } else if (table.includes('_')) { // child
    return {
      type: "object",
      childType: true,
      uuid_paths: [
        split_table[0] + '_uuid', // parent uuid
        table + '_uuid', // child uuid
      ],
      ref_table: split_table[0] as ApiDbTable,
      obj_table: table,
      label: split_table[1] as ApiDbTable
    };
  } else if ([ApiDbTable.us, ApiDbTable.document, ApiDbTable.section, ApiDbTable.echantillon].includes(table)) { // parent Object
    return {
      type: "object",
      uuid_paths: [table + '_uuid'],
      parentType: true,
      child_tables: getChildTables(table),
      ref_table: table,
      obj_table: table,
      label: table
    };
  } else { // Standalone object
    return {
      type: "object",
      uuid_paths: [table + '_uuid'],
      ref_table: table,
      obj_table: table,
      label: table
    };
  }

}

export interface tableDescription {
  /**
   * for objects or Types :
   * first item is main uuid
   * second item is child uuid if applicable
   * for Links:
   * they are 2 uuids of the linked objects in no particular order
   */
  uuid_paths: Array<string>;
  linked_tables?: Array<ApiDbTable>; // if type link then here we have the two linked tables
  type: 'object' | 'link' | 'type'; // type de table
  childType?: boolean; // true si c'est un objet enfant dans le cadre d'un héritage
  parentType?: boolean; // true si c'est un objet parent dans le cadre d'un heritage
  child_tables?: Array<ApiDbTable>; // only available if parenType is true. lists all available childTables
  obj_table: ApiDbTable; // table of the object itself
  ref_table: ApiDbTable; /// table of the local database. could be parent table for example
  label: string; // juste a human friendly displayable label
}
