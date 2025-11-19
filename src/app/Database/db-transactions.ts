import {
  ApiDbTable,
  ApiFait,
  ApiLinkTopoFait,
  ApiProjet,
  ApiSyncable,
  ApiSyncableObject,
  ApiTopo,
  ApiUs,
  TagSystem
} from "../../../shared";
import {DB} from "./DB";
import {Table, Transaction} from "dexie";
import {generateDraftLink, generateDraftObject, returnCurrentObjectVersion, returnObject} from "./db-utils";
import {UI} from "../util/ui";
import {Observable} from "rxjs";
import {observe} from "../util/utils";
import {LOG, LoggerContext} from "ngx-wcore";
import {Manager} from "../util/utilitysingletons/activity-manager";

const CONTEXT: LoggerContext = {
  origin: 'db-transactions'
}

// Execute Promises sequentially and return array of results
  const mapCommitChain = async (iterable: Array<ApiSyncableObject>, tables: Array<Table>) => {
    const results = []

    for (const [index, obj] of iterable.entries()) {
      results.push(await simplecommitToDB(obj, tables, index));
    }
    return results
  }
  export class CastorTransactions {

    static standardObjectTransaction(object: ApiSyncableObject, tables: Array<Table>,timestamp_delay: number): Promise<ApiSyncableObject> {
      return DB.database.executeTransaction(
        async (transaction: Transaction) => {
          const new_object = generateDraftObject(object, timestamp_delay);
          await transaction.table(DB.tableName(object.table)).add(new_object);
          return new_object;
        },
        tables
      );
    }
    static standardLinkTransaction(link: ApiSyncableObject, tables: Array<Table>, timestamp_delay: number ): Promise<ApiSyncableObject> {
      return DB.database.executeTransaction(
        async (transaction: Transaction) => {
          const new_link = generateDraftLink(link, timestamp_delay);
          await transaction.table(DB.tableName(link.table)).add(new_link);
          return new_link;
        },
        tables
      );
    }

    static link_topo_fait(link: ApiLinkTopoFait, tables: Array<Table>, timestamp_delay: number): Promise<ApiSyncableObject> {
      return DB.database.executeTransaction(
        async (transaction: Transaction) => {
          const new_link = generateDraftLink(link, timestamp_delay);
          // get current version
          let related_topo: ApiTopo = await returnObject(transaction.table(DB.tableName(ApiDbTable.topo)),new_link.topo_uuid, 'topo_uuid');
          // update topo if necessary for tagSystem
          if (!related_topo.fait_uuid) {
            related_topo.fait_uuid = link.fait_uuid;
            await simplecommitToDB(related_topo, tables, timestamp_delay);
          }

          return await this.standardLinkTransaction(new_link, tables, timestamp_delay);
        },
        tables
      );
    }


    static standardTypeTransaction(object: ApiSyncableObject, tables: Array<Table>, timestamp_delay: number) {
      return DB.database.executeTransaction(
        async (transaction: Transaction) => {
          const new_object = generateDraftObject(object, timestamp_delay);
          await transaction.table(DB.tableName(object.table)).add(new_object);
          return new_object;
        },
        tables
      );
    }
  }



  export function commitToDB<T extends ApiSyncableObject>( object: T):Observable<Array<ApiSyncableObject>> {
    return bulkCommitToDB([object]);
  }
  export function bulkCommitToDB(objects: Array<ApiSyncableObject>): Observable<Array<ApiSyncableObject>> {
    const transaction_tables: Array<Table> = relevant_tables(objects.map(obj => obj.table));
    return Manager.trackProgress(observe(mapCommitChain(objects, transaction_tables)));
  }
  async function  simplecommitToDB(object: ApiSyncableObject, transaction_tables: Array<Table> = relevant_tables([object.table]), timestamp_delay: number): Promise<ApiSyncableObject> {

    let transaction: () => Promise<ApiSyncableObject>;

    switch (object.table) {
      //// OBJECTS
      case ApiDbTable.contenant:
      case ApiDbTable.document:
      case ApiDbTable.document_photo:
      case ApiDbTable.document_minute:
      case ApiDbTable.echantillon:
      case ApiDbTable.echantillon_mobilier:
      case ApiDbTable.echantillon_prelevement:
      case ApiDbTable.ensemble:
      case ApiDbTable.fait:
      case ApiDbTable.gps:
      case ApiDbTable.file:
      case ApiDbTable.mouvement:
      case ApiDbTable.phase:
      case ApiDbTable.secteur:
      case ApiDbTable.section:
      case ApiDbTable.section_sondage:
      case ApiDbTable.section_coupe:
      case ApiDbTable.stratigraphie:
      case ApiDbTable.us:
      case ApiDbTable.us_sous_division:
      case ApiDbTable.us_construite_materiel:
      case ApiDbTable.us_bati:
      case ApiDbTable.us_construite:
      case ApiDbTable.us_negative:
      case ApiDbTable.us_positive:
      case ApiDbTable.us_squelette:
      case ApiDbTable.us_technique:
      case ApiDbTable.topo:
        transaction = () => CastorTransactions.standardObjectTransaction(object, transaction_tables, timestamp_delay);
        break;
      /// LINKS
      case ApiDbTable.link_topo_fait:
        const link: ApiLinkTopoFait = object as ApiLinkTopoFait;
        transaction = () => CastorTransactions.link_topo_fait(link, transaction_tables, timestamp_delay);
        break;
      case ApiDbTable.link_contenant_echantillon:
      case ApiDbTable.link_document_echantillon:
      case ApiDbTable.link_document_fait:
      case ApiDbTable.link_document_section:
      case ApiDbTable.link_document_us:
      case ApiDbTable.link_ensemble_document:
      case ApiDbTable.link_ensemble_fait:
      case ApiDbTable.link_ensemble_us:
      case ApiDbTable.link_secteur_gps:
      case ApiDbTable.link_section_ensemble:
      case ApiDbTable.link_section_fait:
      case ApiDbTable.link_section_us:
      case ApiDbTable.link_topo_document:
      case ApiDbTable.link_topo_echantillon:
      case ApiDbTable.link_topo_ensemble:
      case ApiDbTable.link_topo_section:
      case ApiDbTable.link_topo_us:
        transaction = () => CastorTransactions.standardLinkTransaction(object, transaction_tables, timestamp_delay);
        break;
      /// TYPES
      case ApiDbTable.type:
        transaction = () => CastorTransactions.standardTypeTransaction(object, transaction_tables, timestamp_delay);
        break;
      /// OTHER
      case ApiDbTable.projet:
      case ApiDbTable.projet_user:
      case ApiDbTable.user_access:
      case ApiDbTable.user:
      case ApiDbTable.type_category:
      default:
        return Promise.reject('unknown table');
    }

    return await DB.database.executeTransaction(async () => {
      await checkTagSystemRules(object, transaction_tables);
      return await transaction();
    }, transaction_tables);

  }


  async function  checkTagSystemRules(new_obj: ApiSyncableObject, parent_transaction_tables: Array<Table>):  Promise<boolean>  {
    LOG.debug.log({...CONTEXT, action: 'checkTagSystemRules'}, new_obj, parent_transaction_tables);
    return DB.database.readCastorDB.transaction('r',[ ...parent_transaction_tables], async (): Promise<boolean> => {
      //get currently available version from DB. Might be null if no version available !
      const current = await returnCurrentObjectVersion(new_obj, parent_transaction_tables.find(t => t.name === DB.tableName(new_obj.table)));
      const project = await returnObject(parent_transaction_tables.find(t => t.name === DB.tableName(ApiDbTable.projet)), UI.state.store.projet_uuid, 'projet_uuid') as ApiProjet;
      LOG.debug.log({...CONTEXT, action: 'checkTagSystemRules', message: new_obj.table},
        project.config.tags.find(t => t.table_name === new_obj.table)?.tag_system,
        project.config.tags);
      const isTag = (tag: TagSystem, table: ApiDbTable = new_obj.table): boolean => {
        return project.config.tags.find(t => t.table_name === table)?.tag_system === tag;
      }

      switch (new_obj.table) {
        case ApiDbTable.contenant:
          shouldBeReadOnly(new_obj, current, ['secteur_uuid']);
          break;
        case ApiDbTable.topo:
          if (isTag(TagSystem.FAIT) ) {
            shouldBeRequiredOnCreation(new_obj, ['fait_uuid']);
            shouldBeReadOnly(new_obj, current, ['fait_uuid']);
          }
          await shouldBeSameSector(new_obj, parent_transaction_tables);
          break;
        case ApiDbTable.us:
          throw Error('us' + ' : ' + new_obj.table + " requires a specified type");
        case ApiDbTable.us_sous_division:
        case ApiDbTable.us_construite_materiel:
        case ApiDbTable.us_bati:
        case ApiDbTable.us_construite:
        case ApiDbTable.us_negative:
        case ApiDbTable.us_positive:
        case ApiDbTable.us_squelette:
        case ApiDbTable.us_technique:
          if (isTag(TagSystem.FAIT, ApiDbTable.us) ){ /// need to specify us in case it is variant
            shouldBeRequiredOnCreation(new_obj, ['fait_uuid']);
            shouldBeReadOnly(new_obj, current, ['fait_uuid']);
          }
          if (isTag(TagSystem.SECTEUR, ApiDbTable.echantillon_prelevement)) { /// prelevement gets secteur through it's US
            shouldBeReadOnly( new_obj, current, ['secteur_uuid']);
          }
          shouldBeRequiredOnCreation(new_obj, ['secteur_uuid']);
          await shouldBeSameSector(new_obj, parent_transaction_tables);
          if (new_obj && current && new_obj.table !== current.table) {
            throw Error('us' + ' : (' + new_obj.table + '!==' + current.table + ") Type can't be changed after creation");
          }
          break;
        case ApiDbTable.echantillon_prelevement:
          shouldBeRequiredOnCreation(new_obj, ['us_uuid']);
          if (isTag(TagSystem.PRELEVEMENT_NATURE) ) {
            shouldBeRequiredOnCreation(new_obj, ['type_nature_uuid']);
            shouldBeReadOnly(new_obj, current, ['type_nature_uuid']);
          }
          if (isTag(TagSystem.PRELEVEMENT_NATURE_US) || isTag(TagSystem.PRELEVEMENT_US_NATURE) ) {
            shouldBeRequiredOnCreation(new_obj, ['us_uuid', 'type_nature_uuid']);
            shouldBeReadOnly(new_obj, current, ['us_uuid', 'type_nature_uuid']);
          }
          if (isTag(TagSystem.PRELEVEMENT_US) || isTag(TagSystem.SECTEUR) ) {
            shouldBeReadOnly(new_obj, current, ['us_uuid']);
          }

          break;
        case ApiDbTable.echantillon_mobilier:
          shouldBeRequiredOnCreation(new_obj, ['us_uuid']);
          if (isTag(TagSystem.MOBILIER_MATERIAU_US) || isTag(TagSystem.MOBILIER_US_MATERIAU)) {
            shouldBeRequiredOnCreation(new_obj, ['us_uuid', 'type_materiaux_uuid']);
            shouldBeReadOnly(new_obj, current, ['us_uuid', 'type_materiaux_uuid']);
          }
          if (isTag(TagSystem.MOBILIER_MATERIAU)) {
            shouldBeRequiredOnCreation(new_obj, ['type_materiaux_uuid']);
            shouldBeReadOnly(new_obj, current, ['type_materiaux_uuid']);
          }

          if (isTag(TagSystem.MOBILIER_US)){
            shouldBeRequiredOnCreation(new_obj, ['us_uuid']);
            shouldBeReadOnly(new_obj, current, ['us_uuid']);
          }

          break;
        default:
          break;
      }

      /// applicable rule to any object :
      if (isTag(TagSystem.SECTEUR) ) {
        switch (new_obj.table) {
          case ApiDbTable.echantillon_prelevement:
          case ApiDbTable.echantillon_mobilier:
            shouldBeRequiredOnCreation( new_obj, ['us_uuid']);
            shouldBeReadOnly( new_obj, current, ['us_uuid']);
            break;
          default:
            shouldBeRequiredOnCreation(new_obj, ['secteur_uuid']);
            shouldBeReadOnly( new_obj, current, ['secteur_uuid']);
            await shouldBeSameSector(new_obj, parent_transaction_tables);
            break;
        }
      }

      return true;
    });



  }


  function relevant_tables (tables: Array<ApiDbTable>, arr: Array<Table> = []): Array<Table> {
    arr.push(DB.database.getTableByRef(ApiDbTable.projet));
    tables.forEach(table => {
      arr.push(DB.database.getTableByRef(table));
      // additional exceptional tables
      switch (table) {
        case ApiDbTable.link_topo_fait:
          arr.push(DB.database.getTableByRef(ApiDbTable.topo));
          break;
        case ApiDbTable.us:
        case ApiDbTable.us_sous_division:
        case ApiDbTable.us_construite_materiel:
        case ApiDbTable.us_bati:
        case ApiDbTable.us_construite:
        case ApiDbTable.us_negative:
        case ApiDbTable.us_positive:
        case ApiDbTable.us_squelette:
        case ApiDbTable.us_technique:
          arr.push(DB.database.getTableByRef(ApiDbTable.fait));
          break;
        case ApiDbTable.topo:
          arr.push(DB.database.getTableByRef(ApiDbTable.fait));
          break;
      }
    });
    arr = arr.filter((value,index,array)=> array.findIndex(v2=>(v2?.name === value?.name))===index)
    LOG.debug.log({...CONTEXT, action: 'relevant_tables'}, tables, arr);
    if (arr.includes(undefined) || arr.includes(null)) {
      LOG.error.log({...CONTEXT, action: 'relevant_tables'}, tables, arr);
      throw Error('Couldn\'t find table');
    }
    return arr;
  }


  function shouldBeRequiredOnCreation(newObj: ApiSyncableObject, variables: Array<string>){
    // @ts-ignore
    variables.forEach(val => {
      if ( !newObj[val]) {
        LOG.error.log({...CONTEXT, action: 'shouldBeRequiredOnCreation'}, newObj, variables);
        throw Error(newObj.table + ' : ' + val + " is required ");
      }
    });
  }
  function shouldBeReadOnly(newObj: ApiSyncableObject, currentObj: ApiSyncable, variables: Array<string>){
    if (currentObj) {
      // @ts-ignore
      variables.forEach(val => {
        if ( newObj[val] !== currentObj[val]) {
          LOG.error.log({...CONTEXT, action: 'shouldBeReadOnly'}, newObj, currentObj, variables);
          throw Error(newObj.table + ' : ' + val + " can't be changed after creation");
        }
      });
    }
  }
  async function shouldBeSameSector(new_obj: ApiSyncableObject, parent_transaction_tables: Array<Table>) {
    if(new_obj['fait_uuid'] && new_obj['secteur_uuid']) {
      LOG.debug.log({...CONTEXT, action: 'shouldBeSameSector ( -> FAIT)'}, new_obj);
      const fait: ApiFait = await returnObject(parent_transaction_tables.find(t => t.name === DB.tableName(ApiDbTable.fait)), (new_obj as ApiUs).fait_uuid, 'fait_uuid');
      if (fait.secteur_uuid !== (new_obj as ApiUs).secteur_uuid) {
        LOG.error.log({...CONTEXT, action: 'shouldBeSameSector ( -> FAIT)'}, fait, new_obj);
        throw new Error('Different Sector in relationship !!');
      }
    }
    if(new_obj['us_uuid'] && new_obj['secteur_uuid']) {
      LOG.debug.log({...CONTEXT, action: 'shouldBeSameSector ( -> US)'}, new_obj);
      const us: ApiUs = await returnObject(parent_transaction_tables.find(t => t.name === DB.tableName(ApiDbTable.us)), (new_obj as ApiUs).us_uuid, 'us_uuid');
      if (us.secteur_uuid !== (new_obj as ApiUs).secteur_uuid) {
        LOG.error.log({...CONTEXT, action: 'shouldBeSameSector ( -> US)'}, us, new_obj);
        throw new Error('Different Sector in relationship !!');
      }
    }
  }
