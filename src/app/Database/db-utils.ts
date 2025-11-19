import {
  ApiContenant,
  ApiDbTable,
  ApiDocument,
  ApiDocumentMinute,
  ApiDocumentPhoto,
  ApiEchantillon,
  ApiEchantillonMobilier,
  ApiEchantillonPrelevement,
  ApiEnsemble,
  ApiFait,
  ApiGps,
  ApiLinkContenantEchantillon,
  ApiLinkDocumentEchantillon,
  ApiLinkDocumentEnsemble,
  ApiLinkDocumentFait,
  ApiLinkDocumentSection,
  ApiLinkDocumentTopo,
  ApiLinkDocumentUs,
  ApiLinkEnsembleFait,
  ApiLinkEnsembleUs,
  ApiLinkSecteurGps,
  ApiLinkSectionEnsemble,
  ApiLinkSectionFait,
  ApiLinkSectionUs,
  ApiLinkTopoEchantillon,
  ApiLinkTopoEnsemble,
  ApiLinkTopoFait,
  ApiLinkTopoSection,
  ApiLinkTopoUs,
  ApiMouvement,
  ApiPhase,
  ApiProjet,
  ApiSecteur,
  ApiSection,
  ApiSectionCoupe,
  ApiSectionSondage,
  ApiStratigraphie,
  ApiSyncable,
  ApiSyncableObject,
  ApiSyncableObjectIndex,
  ApiSyncableType,
  ApiTopo,
  ApiUs,
  ApiUsBati,
  ApiUsConstruite,
  ApiUsNegative,
  ApiUsPositive,
  ApiUsSquelette,
  ApiUsTechnique,
} from "../../../shared";
import Dexie, {IndexableType, PromiseExtended, Table} from "dexie";
import {Observable, of} from "rxjs";
import {observe} from "../util/utils";
import {map} from "rxjs/operators";
import {v4 as uuidv4} from "uuid";
import {LOG, LoggerContext} from "ngx-wcore";
import {DB} from "./DB";
import {UI} from "../util/ui";
import {
  filterForSelectedProject,
  generateUniqueVersionLinkList,
  generateUniqueVersionObjectList,
  getTableDescription,
  tableDescription
} from "../DataClasses/models/sync-obj-utilities";

const CONTEXT: LoggerContext = {
  origin: 'DB-Utils'
}


/**
 * Generate new version for object as a draft
 *
 * @param {T} obj - The object to generate a draft version for
 * @param {number} timestamp_delay - The delay in milliseconds to add to the created timestamp of the draft object
 * @return {T} - The generated draft object
 */
export function generateDraftObject<T extends ApiSyncableObject | ApiSyncableType>(obj: T, timestamp_delay: number): T {
  const info: tableDescription = getTableDescription(obj.table);

  obj = Dexie.deepClone(obj);
  obj.created = new Date().getTime() + timestamp_delay;
  obj.draft = true;
  if (obj.table !== ApiDbTable.projet) {
    (obj as ApiSyncableObject).projet_uuid = UI.state.store.projet_uuid;
  }

  const uuid: string = handleObjectUUID(obj[info.uuid_paths[0]]);
  let index: ApiSyncableObjectIndex = {
    projet_uuid: UI.state.store.projet_uuid,
    table: obj.table,
    created: obj.created,
    value: uuid,
    key: info.uuid_paths[0]
  };
  switch (info.type) {
    case "object":
      obj[info.uuid_paths[0]] = uuid;
      if (info.childType) {
        obj[info.uuid_paths[1]] = uuid;
        LOG.debug.log({...CONTEXT, action: 'added child Object uuid'}, obj);
      } else {
        LOG.debug.log({...CONTEXT, action: 'added object uuid'}, obj);
      }
      index.key = info.uuid_paths[0];
      index.value = uuid;
      break;
    case "link": // link uuids are never unknown
      LOG.debug.log({...CONTEXT, action: 'is link, nothing to do'}, obj);
      break;
    case "type":
      obj['type_uuid'] = uuid;
      LOG.debug.log({...CONTEXT, action: 'added type uuid'}, obj);
      index.key = 'type_uuid';
      index.value = uuid;
      break;
  }
  return obj;
}
export function generateDraftLink<T extends ApiSyncableObject | ApiSyncableType>(obj: T, timestamp_delay: number): T {
  obj = Dexie.deepClone(obj);
  obj.created = new Date().getTime() + timestamp_delay;
  obj.draft = true;
  return obj;
}
export function saveObject<T extends ApiSyncableObject | ApiSyncableType>(table: Table<T>, obj: T, timestamp_delay: number): Observable<IndexableType> {
  obj = generateDraftObject(obj, timestamp_delay);
 // LOG.debug.log({...CONTEXT, action: 'add to DB'}, obj);
  return observe(table.add(obj));
}

export function saveLink<T extends ApiSyncableObject>(table: Table<T>, obj: T,timestamp_delay: number): Observable<IndexableType> {
  return observe(table.add(generateDraftLink(obj, timestamp_delay)));
}


export function syncObject<T extends ApiSyncable>(table: Table<T>, obj: T): Observable<IndexableType> {
  obj = Dexie.deepClone(obj);
 // LOG.debug.log({...CONTEXT, action: 'add to DB'}, obj);
  return observe(table.put(obj));
}

/*export function updateItem<T extends ApiSyncable>(table: Table<T>, obj: T, key: string): Observable<IndexableType> {
  obj = Dexie.deepClone(obj);
 // LOG.debug.log({...CONTEXT, action: 'update DB'}, obj);
  return observe(table.update(key, obj));
}*/


export function syncLink<T extends ApiSyncableObject>(table: Table<T>, obj: T): Observable<IndexableType> {
  obj = Dexie.deepClone(obj);
  return observe(table.put(obj));
}


export interface LinkUuid {
  uuid: string;
  key: string;
}

export async function returnLink<T>(table: Table<T>, uuid1: LinkUuid, uuid2: LinkUuid, created: number) {
  const value = created ? await table.where({
    [uuid1.key]: uuid1.uuid,
    [uuid2.key]: uuid2.uuid,
    created: created
  }).sortBy('created')
  : await table.where({
      [uuid1.key]: uuid1.uuid,
      [uuid2.key]: uuid2.uuid
    }).sortBy('created');
  return value[0] ?? null;
}

export async function returnObject<T>(table: Table<T>, uuid: string, uuid_path: string) {
 // LOG.debug.log({...CONTEXT, action: 'returnObject'},table,  uuid, uuid_path);
  uuid = uuid ?? '';
  const value = await table.where({[uuid_path]: uuid}).reverse().sortBy('created');
  return value[0] ?? null;

}
/**
 * Returns the current version of the given object.
 * @param {ApiSyncableObject} obj - The object whose version is to be retrieved.
 * @param {Table} table - The table to search for the object.
 * @returns {Promise<ApiSyncableObject>} - The current version of the given object.
 */
export async function returnCurrentObjectVersion<T>(obj: ApiSyncableObject, table: Table = DB.database.getTableByRef(obj.table)): Promise<ApiSyncableObject> {
  const info = getTableDescription(obj.table);

  if (info.type === 'object') {
    const uuid_path = info.uuid_paths[0];
    const uuid: string = obj[uuid_path];
    return returnObject(table, uuid, uuid_path);
  } else if (info.type === 'link') {
    const uuid1: LinkUuid = {
      key: info.uuid_paths[0],
      uuid: obj[info.uuid_paths[0]]
    };
    const uuid2: LinkUuid = {
      key: info.uuid_paths[1],
      uuid: obj[info.uuid_paths[1]]
    };
    return returnLink(table, uuid1, uuid2, obj.created);
  } else {
    /// type `???
    return null;
  }


}

/**
 * Generates or retrieves the UUID for an object.
 *
 * @param {string} obj_uuid - The UUID of the object (optional).
 * @returns {string} - The generated or retrieved UUID.
 */
export const handleObjectUUID = (obj_uuid: string): string => {
  if (!obj_uuid) { // it's a new Object; generate a new uuid
    return uuidv4();
  } else { // it's an already existing Object. keep old uuid
    return obj_uuid;
  }
}


/**
 * Return a filtered array of objects from a given table based on the unique version link list.
 *
 * @param {Table<T>} table - The table object from where to fetch the data.
 * @param {string} uuid_path1 - The first UUID path to filter by.
 * @param {string} uuid_path2 - The second UUID path to filter by.
 * @returns {Observable<Array<T>>} The filtered array of objects from the table.
 */
export function returnLinkList<T extends ApiSyncableObject>(table: Table<T>, uuid_path1: string, uuid_path2: string) {
  return observe(table.toArray()).pipe(
    map((value) => {
      return filterForSelectedProject(table.name as ApiDbTable, generateUniqueVersionLinkList(value, uuid_path1, uuid_path2));
    })
  ) as Observable<Array<T>>;
}


/**
 * Returns an observable that emits an array of objects of type T.
 * The objects are obtained from the given table in the database by executing a query.
 *
 * @param {Table<T>} table - The table from which to retrieve the objects.
 * @param {string} uuid_path - The path to the UUID attribute in the objects.
 * @returns {Observable<Array<T>>} The observable that emits the array of objects.
 */
export function returnObjectList<T extends ApiSyncableObject | ApiSyncableType>(table: Table<T>, uuid_path: string): Observable<Array<T>> {
  let query: PromiseExtended<Array<T>>;
  query = table.toArray();

  return observe(query).pipe(
    map((value) => {
      /// MUST firts be filtered by project before being filtered by version to avoid losing types with same uuid but multiple projects
      return generateUniqueVersionObjectList( filterForSelectedProject(table.name as ApiDbTable, value), uuid_path);
    })
  ) as Observable<Array<T>>;
}


/**
 * Store a castor object in the database.
 *
 * @param {ApiSyncable} object - The object to store.
 * @param {string} project_uuid - The project UUID.
 *
 * @return {Observable<IndexableType>} - The observable that emits the stored object.
 */
export function storeCastorObject(object: ApiSyncable, project_uuid: string): Observable<IndexableType> {
  const info = getTableDescription(object.table);
  LOG.debug.log({
    ...CONTEXT,
    action: 'storeCastorObject',
    message: info.type === 'type' ? 'isTYPE': 'is NOT TYPE',
  }, object, info);
  if (info.type !== 'type') {
    (object as ApiSyncableObject).projet_uuid = project_uuid;

    LOG.debug.log({
      ...CONTEXT,
      action: 'storeCastorObject',
      message: 'is NOT TYPE & does have project uuid'
    }, object, project_uuid);
  } else if (info.type !== 'type' && !project_uuid) {
    LOG.error.log({
      ...CONTEXT,
      action: 'storeCastorObject',
      message: 'is NOT TYPE & does not have project uuid !!!'
    }, object, project_uuid);
  } else if(info.type === 'type') {
    LOG.debug.log({...CONTEXT, action: 'storeCastorObject', message: 'is TYPE does not have project uuid'}, object);
  } else {
    LOG.debug.log({...CONTEXT, action: 'storeCastorObject', message: 'is NOT TYPE & does not have project uuid'}, object);
  }
  if (DB.database.isReady && object && object.table) {
    switch (object.table) {
      case ApiDbTable.type:
        return DB.database.type.sync(object as ApiSyncableType);
      case ApiDbTable.link_contenant_echantillon:
        return DB.database.link_contenant_echantillon.sync(object as ApiLinkContenantEchantillon);
      case ApiDbTable.link_document_echantillon:
        return DB.database.link_document_echantillon.sync(object as ApiLinkDocumentEchantillon);
      case ApiDbTable.link_document_fait:
        return DB.database.link_document_fait.sync(object as ApiLinkDocumentFait);
      case ApiDbTable.link_document_section:
        return DB.database.link_document_section.sync(object as ApiLinkDocumentSection);
      case ApiDbTable.link_document_us:
        return DB.database.link_document_us.sync(object as ApiLinkDocumentUs);
      case ApiDbTable.link_ensemble_document:
        return DB.database.link_ensemble_document.sync(object as ApiLinkDocumentEnsemble);
      case ApiDbTable.link_ensemble_fait:
        return DB.database.link_ensemble_fait.sync(object as ApiLinkEnsembleFait);
      case ApiDbTable.link_ensemble_us:
        return DB.database.link_ensemble_us.sync(object as ApiLinkEnsembleUs);
      case ApiDbTable.link_secteur_gps:
        return DB.database.link_secteur_gps.sync(object as ApiLinkSecteurGps);
      case ApiDbTable.link_section_ensemble:
        return DB.database.link_section_ensemble.sync(object as ApiLinkSectionEnsemble);
      case ApiDbTable.link_section_fait:
        return DB.database.link_section_fait.sync(object as ApiLinkSectionFait);
      case ApiDbTable.link_section_us:
        return DB.database.link_section_us.sync(object as ApiLinkSectionUs);
      case ApiDbTable.link_topo_document:
        return DB.database.link_topo_document.sync(object as ApiLinkDocumentTopo);
      case ApiDbTable.link_topo_echantillon:
        return DB.database.link_topo_echantillon.sync(object as ApiLinkTopoEchantillon);
      case ApiDbTable.link_topo_ensemble:
        return DB.database.link_topo_ensemble.sync(object as ApiLinkTopoEnsemble);
      case ApiDbTable.link_topo_fait:
        return DB.database.link_topo_fait.sync(object as ApiLinkTopoFait);
      case ApiDbTable.link_topo_section:
        return DB.database.link_topo_section.sync(object as ApiLinkTopoSection);
      case ApiDbTable.link_topo_us:
        return DB.database.link_topo_us.sync(object as ApiLinkTopoUs);
      case ApiDbTable.user:
        return DB.database.link_contenant_echantillon.sync(object as ApiLinkContenantEchantillon);
      case ApiDbTable.document:
        return DB.database.document.sync(object as ApiDocument);
      case ApiDbTable.document_photo:
        return DB.database.document.sync(object as ApiDocumentPhoto);
      case ApiDbTable.document_minute:
        return DB.database.document.sync(object as ApiDocumentMinute);
      case ApiDbTable.echantillon:
        return DB.database.echantillon.sync(object as ApiEchantillon);
      case ApiDbTable.echantillon_mobilier:
        return DB.database.echantillon.sync(object as ApiEchantillonMobilier);
      case ApiDbTable.echantillon_prelevement:
        return DB.database.echantillon.sync(object as ApiEchantillonPrelevement);
      case ApiDbTable.ensemble:
        return DB.database.ensemble.sync(object as ApiEnsemble);
      case ApiDbTable.fait:
        return DB.database.fait.sync(object as ApiFait);
      case ApiDbTable.gps:
        return DB.database.gps.sync(object as ApiGps);
      case ApiDbTable.mouvement:
        return DB.database.mouvement.sync(object as ApiMouvement);
      case ApiDbTable.phase:
        return DB.database.phase.sync(object as ApiPhase);
      case ApiDbTable.projet:
        return DB.database.projet.sync(object as ApiProjet);
      case ApiDbTable.secteur:
        return DB.database.secteur.sync(object as ApiSecteur);
      case ApiDbTable.section:
        return DB.database.section.sync(object as ApiSection);
      case ApiDbTable.section_sondage:
        return DB.database.section.sync(object as ApiSectionSondage);
      case ApiDbTable.section_coupe:
        return DB.database.section.sync(object as ApiSectionCoupe);
      case ApiDbTable.stratigraphie:
        return DB.database.stratigraphie.sync(object as ApiStratigraphie);
      case ApiDbTable.topo:
        return DB.database.topo.sync(object as ApiTopo);
      case ApiDbTable.us:
        return DB.database.us.sync(object as ApiUs);
      case ApiDbTable.us_bati:
        return DB.database.us.sync(object as ApiUsBati);
      case ApiDbTable.us_construite:
        (object as ApiUsConstruite).us_uuid = (object as ApiUsConstruite).us_construite_uuid;
        return DB.database.us.sync(object as ApiUsConstruite);
      case ApiDbTable.us_negative:
        return DB.database.us.sync(object as ApiUsNegative);
      case ApiDbTable.us_positive:
        return DB.database.us.sync(object as ApiUsPositive);
      case ApiDbTable.us_squelette:
        return DB.database.us.sync(object as ApiUsSquelette);
      case ApiDbTable.us_technique:
        return DB.database.us.sync(object as ApiUsTechnique);
      case ApiDbTable.contenant:
        return DB.database.contenant.sync(object as ApiContenant);
      default:
        return of(null);
    }
  } else {
    LOG.debug.log({...CONTEXT, action: 'storeCastorObject'}, object);
    return of(null);
  }
}

