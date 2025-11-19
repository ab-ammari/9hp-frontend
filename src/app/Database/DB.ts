import {Castordb} from "./castordb";
import {
  ApiContenant,
  ApiDbTable,
  ApiDocument,
  ApiEchantillon,
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
  ApiStratigraphie, ApiSyncable, ApiSyncableFile, ApiSyncableObject,
  ApiSyncableType,
  ApiTopo,
  ApiUs
} from "../../../shared";
import {Sessiondb} from "./sessiondb";
import {LOG, LoggerContext} from "ngx-wcore";
import {dbObject} from "./db-object";
import {dbLink} from "./db-link";
import {BehaviorSubject, combineAll, from, merge, Observable, Subject, timer} from "rxjs";
import {IDatabaseChange} from "dexie-observable/api";
import {debounce, mergeMap, share, tap} from "rxjs/operators";
import {UserSession} from "../DataClasses/models/db-user-session";
import Dexie, {IndexableType, Transaction} from "dexie";
import {ProjectIndexStore} from "./project-index-store";
import {observe, triggerChangeDetection} from "../util/utils";
import {dbType} from "./db-type";
import Table = Dexie.Table;
import {dbFile} from "./db-file";

const CONTEXT: LoggerContext = {
  origin: 'Database'
}

export class DB {

  static readonly database = new DB();

  private readonly sessionDB: Sessiondb = new Sessiondb('SESSION');
  private readonly castorDB: Castordb = new Castordb('REF');
  get readCastorDB(): Castordb {
    return this.castorDB;
  }
  projet: dbObject<ApiProjet>;

  type: dbType<ApiSyncableType>;

  file: dbFile;

  /// OBJECTS
  secteur: dbObject<ApiSecteur>;
  us: dbObject<ApiUs>;
  fait: dbObject<ApiFait>;
  contenant: dbObject<ApiContenant>;
  document: dbObject<ApiDocument>;
  ensemble: dbObject<ApiEnsemble>;
  gps: dbObject<ApiGps>;
  echantillon: dbObject<ApiEchantillon>;
  mouvement: dbObject<ApiMouvement>;
  phase: dbObject<ApiPhase>;
  section: dbObject<ApiSection>;
  stratigraphie: dbObject<ApiStratigraphie>;
  topo: dbObject<ApiTopo>;

  /// RELATIONSHIPS
  link_document_echantillon: dbLink<ApiLinkDocumentEchantillon>;
  link_document_fait: dbLink<ApiLinkDocumentFait>;
  link_document_section: dbLink<ApiLinkDocumentSection>;
  link_document_us: dbLink<ApiLinkDocumentUs>;
  link_ensemble_document: dbLink<ApiLinkDocumentEnsemble>;
  link_topo_document: dbLink<ApiLinkDocumentTopo>;
  link_topo_echantillon: dbLink<ApiLinkTopoEchantillon>;
  link_topo_ensemble: dbLink<ApiLinkTopoEnsemble>;
  link_topo_fait: dbLink<ApiLinkTopoFait>;
  link_topo_section: dbLink<ApiLinkTopoSection>;
  link_topo_us: dbLink<ApiLinkTopoUs>;
  link_section_ensemble: dbLink<ApiLinkSectionEnsemble>;
  link_section_fait: dbLink<ApiLinkSectionFait>;
  link_section_us: dbLink<ApiLinkSectionUs>;
  link_ensemble_fait: dbLink<ApiLinkEnsembleFait>;
  link_ensemble_us: dbLink<ApiLinkEnsembleUs>;
  link_secteur_gps: dbLink<ApiLinkSecteurGps>;
  link_contenant_echantillon: dbLink<ApiLinkContenantEchantillon>;

  //TYPES


  // MISC
  user_session: UserSession;
  project_index: ProjectIndexStore;


  // states
  get status(): Observable<dbStatus> {
    return this._status.asObservable();
  }

  get isReady(): boolean {
    return this.ready;
  }

  get castor_db_list() {
    return this.ready ? [
      ...this.object_table_list,
      ...this.link_table_List,
      ...this.type_table_list,
      this.castorDB.file
    ] : [];
  }

  get object_table_list(): Array<Table> {
    return this.isReady ? [
      this.castorDB.projet,
      this.castorDB.secteur,
      this.castorDB.document,
      this.castorDB.fait,
      this.castorDB.us,
      this.castorDB.contenant,
      this.castorDB.ensemble,
      this.castorDB.gps,
      this.castorDB.echantillon, // mobilier + préélevement
      this.castorDB.mouvement,
      this.castorDB.phase,
      this.castorDB.section, // coupe + sondage
      this.castorDB.stratigraphie,
      this.castorDB.topo,
    ] : [];
  }

  get type_table_list(): Array<Table> {
    return this.isReady ? [
      this.castorDB.type
    ] : [];
  }

  get link_table_List() {
    return this.isReady ? [
      this.castorDB.document_echantillon,
      this.castorDB.document_fait,
      this.castorDB.document_section,
      this.castorDB.document_us,
      this.castorDB.ensemble_document,
      this.castorDB.topo_document,
      this.castorDB.topo_echantillon,
      this.castorDB.topo_ensemble,
      this.castorDB.topo_fait,
      this.castorDB.topo_section,
      this.castorDB.topo_us,
      this.castorDB.section_ensemble,
      this.castorDB.section_fait,
      this.castorDB.section_us,
      this.castorDB.ensemble_fait,
      this.castorDB.ensemble_us,
      this.castorDB.secteur_gps,
      this.castorDB.contenant_echantillon,
    ] : [];
  }

  get linkList() {
    return this.isReady ? [
      this.link_document_echantillon,
      this.link_document_fait,
      this.link_document_section,
      this.link_document_us,
      this.link_ensemble_document,
      this.link_topo_document,
      this.link_topo_echantillon,
      this.link_topo_ensemble,
      this.link_topo_fait,
      this.link_topo_section,
      this.link_topo_us,
      this.link_section_ensemble,
      this.link_section_fait,
      this.link_section_us,
      this.link_ensemble_fait,
      this.link_ensemble_us,
      this.link_secteur_gps,
      this.link_contenant_echantillon,
    ] : [];
  }

  private ready: boolean = false;
  private _status: BehaviorSubject<dbStatus> = new BehaviorSubject<dbStatus>(dbStatus.init);
  private castorStatus: BehaviorSubject<dbStatus> = new BehaviorSubject<dbStatus>(dbStatus.init);
  private sessionStatus: BehaviorSubject<dbStatus> = new BehaviorSubject<dbStatus>(dbStatus.init);

  // event
  get on_change(): Observable<IDatabaseChange> {
    return this._on_change.asObservable().pipe(share());
  }

  private _on_change: Subject<IDatabaseChange> = new Subject<IDatabaseChange>();

  constructor() {
    LOG.debug.log({...CONTEXT}, 'constructor');
    this._status.pipe(
      tap((value) => {this.ready = value === dbStatus.ready;}),
      debounce(() => timer(500))).subscribe((value) => {
      triggerChangeDetection();
    });
    merge(this.sessionDB.on_changes, this.castorDB.on_changes).pipe(mergeMap((list: IDatabaseChange[]) => from(list))).subscribe(next => {
      LOG.debug.log({...CONTEXT, action: 'DB changes'}, next);
      this._on_change.next(next);
    });
    merge(this.castorStatus, this.sessionStatus).subscribe(next => {
      LOG.info.log({...CONTEXT, action: 'merge DB status'}, next, this.castorStatus.value, this.sessionStatus.value);
      if (this.castorStatus.value === dbStatus.error
        || this.sessionStatus.value === dbStatus.error) {
        this._status.next(dbStatus.error);
      } else if (this.castorStatus.value === dbStatus.ready
        && this.sessionStatus.value === dbStatus.ready) {
        this._status.next(dbStatus.ready);
      } else {
        this._status.next(dbStatus.init);
      }
    });
    this.castorDB.on_ready.subscribe(() => this.setupCastorObjects());
    this.sessionDB.on_ready.subscribe(() => this.setupSessionObjects());
    this.castorDB.on_close.subscribe(() => this.sessionStatus.next(dbStatus.init));
    this.sessionDB.on_close.subscribe(() => this.sessionStatus.next(dbStatus.init));
    this.castorDB.on_blocked.subscribe(() => this.sessionStatus.next(dbStatus.error));
    this.sessionDB.on_close.subscribe(() => this.sessionStatus.next(dbStatus.error));

    this.on_change.pipe(
      tap((value) => {
        LOG.debug.log({...CONTEXT, action: 'onChange'}, value);
      })
    ).subscribe();
  }


  private setupCastorObjects() {
    LOG.debug.log({...CONTEXT}, 'setupTypes');

    this.type = new dbType<ApiSyncableType>(this.castorDB.type, ApiDbTable.type);
    this.file = new dbFile(this.castorDB.file);

    LOG.debug.log({...CONTEXT}, 'setupObjects');
    this.projet = new dbObject<ApiProjet>(this.castorDB.projet, ApiDbTable.projet);
    // add config to objects to enforce limitations on tag systems
    this.secteur = new dbObject<ApiSecteur>(this.castorDB.secteur, ApiDbTable.secteur);
    this.document = new dbObject<ApiDocument>(this.castorDB.document, ApiDbTable.document);
    this.fait = new dbObject<ApiFait>(this.castorDB.fait, ApiDbTable.fait);
    this.us = new dbObject<ApiUs>(this.castorDB.us, ApiDbTable.us);
    this.contenant = new dbObject<ApiContenant>(this.castorDB.contenant, ApiDbTable.contenant);
    this.ensemble = new dbObject<ApiEnsemble>(this.castorDB.ensemble, ApiDbTable.ensemble);
    this.gps = new dbObject<ApiGps>(this.castorDB.gps, ApiDbTable.gps);
    this.echantillon = new dbObject<ApiEchantillon>(this.castorDB.echantillon, ApiDbTable.echantillon);
    this.mouvement = new dbObject<ApiMouvement>(this.castorDB.mouvement, ApiDbTable.mouvement);
    this.phase = new dbObject<ApiPhase>(this.castorDB.phase, ApiDbTable.phase);
    this.section = new dbObject<ApiSection>(this.castorDB.section, ApiDbTable.section);
    this.stratigraphie = new dbObject<ApiStratigraphie>(this.castorDB.stratigraphie, ApiDbTable.stratigraphie);
    this.topo = new dbObject<ApiTopo>(this.castorDB.topo, ApiDbTable.topo);

    LOG.debug.log({...CONTEXT}, 'setupLinks');

    this.link_document_echantillon = new dbLink<ApiLinkDocumentEchantillon>(this.castorDB.document_echantillon, ApiDbTable.link_document_echantillon);
    this.link_document_fait = new dbLink<ApiLinkDocumentFait>(this.castorDB.document_fait, ApiDbTable.link_document_fait);
    this.link_document_section = new dbLink<ApiLinkDocumentSection>(this.castorDB.document_section, ApiDbTable.link_document_section);
    this.link_document_us = new dbLink<ApiLinkDocumentUs>(this.castorDB.document_us, ApiDbTable.link_document_us);
    this.link_ensemble_document = new dbLink<ApiLinkDocumentEnsemble>(this.castorDB.ensemble_document, ApiDbTable.link_ensemble_document);
    this.link_topo_document = new dbLink<ApiLinkDocumentTopo>(this.castorDB.topo_document, ApiDbTable.link_topo_document);
    this.link_topo_echantillon = new dbLink<ApiLinkTopoEchantillon>(this.castorDB.topo_echantillon, ApiDbTable.link_topo_echantillon);
    this.link_topo_ensemble = new dbLink<ApiLinkTopoEnsemble>(this.castorDB.topo_ensemble, ApiDbTable.link_topo_ensemble);
    this.link_topo_fait = new dbLink<ApiLinkTopoFait>(this.castorDB.topo_fait, ApiDbTable.link_topo_fait);
    this.link_topo_section = new dbLink<ApiLinkTopoSection>(this.castorDB.topo_section, ApiDbTable.link_topo_section);
    this.link_topo_us = new dbLink<ApiLinkTopoUs>(this.castorDB.topo_us, ApiDbTable.link_topo_us);
    this.link_section_ensemble = new dbLink<ApiLinkSectionEnsemble>(this.castorDB.section_ensemble, ApiDbTable.link_section_ensemble);
    this.link_section_fait = new dbLink<ApiLinkSectionFait>(this.castorDB.section_fait, ApiDbTable.link_section_fait);
    this.link_section_us = new dbLink<ApiLinkSectionUs>(this.castorDB.section_us, ApiDbTable.link_section_us);
    this.link_ensemble_fait = new dbLink<ApiLinkEnsembleFait>(this.castorDB.ensemble_fait, ApiDbTable.link_ensemble_fait);
    this.link_ensemble_us = new dbLink<ApiLinkEnsembleUs>(this.castorDB.ensemble_us, ApiDbTable.link_ensemble_us);
    this.link_secteur_gps = new dbLink<ApiLinkSecteurGps>(this.castorDB.secteur_gps, ApiDbTable.link_secteur_gps);
    this.link_contenant_echantillon = new dbLink<ApiLinkContenantEchantillon>(this.castorDB.contenant_echantillon, ApiDbTable.link_contenant_echantillon);


    this.castorStatus.next(dbStatus.ready);
  }

  private setupSessionObjects() {
    LOG.debug.log({...CONTEXT}, 'setupObjects');
    this.user_session = new UserSession(this.sessionDB.user);
    this.project_index = new ProjectIndexStore(this.sessionDB.projet_index);
    this.sessionStatus.next(dbStatus.ready);
  }

  async Armageddon() {

    await Dexie.delete('REF');
    await Dexie.delete('SESSION');
    location.replace('http://' + location.host + '/');
  }

   async executeTransaction<T extends ApiSyncableObject>( transaction: (trans: Transaction) => PromiseLike<T> | T, tables: Array<Table>): Promise<T> {
    LOG.debug.log({...CONTEXT, action: 'executeTransaction'}, tables, transaction);
    return DB.database.castorDB.transaction('rw', tables, transaction);
  }
   async executeReadOnlyTransaction<T extends Array<ApiSyncable>>( transaction: (trans: Transaction) => PromiseLike<T> | T, tables: Array<Table>): Promise<T> {
    LOG.debug.log({...CONTEXT, action: 'executeReadOnlyTransaction'}, tables, transaction);
    return DB.database.castorDB.transaction('r', tables, transaction);
  }

  getTableByRef(name: ApiDbTable): Table {
          return this.castor_db_list.find(table => table.name === DB.tableName(name));
  }
  static tableName(name: ApiDbTable): ApiDbTable {
    if (name.includes('link_')) {
      LOG.debug.log({...CONTEXT, action: 'tableName_link'}, name, name.replace('link_', ''));
      return name.replace('link_', '') as ApiDbTable;
    } else {
      switch (name) {
        case ApiDbTable.section_sondage:
        case ApiDbTable.section_coupe:
          return  ApiDbTable.section;
        case ApiDbTable.us_bati:
        case ApiDbTable.us_construite:
        case ApiDbTable.us_positive:
        case ApiDbTable.us_negative:
        case ApiDbTable.us_technique:
        case ApiDbTable.us_squelette:
        case ApiDbTable.us_construite_materiel:
        case ApiDbTable.us_sous_division:
          return ApiDbTable.us;
        case ApiDbTable.echantillon_prelevement:
        case ApiDbTable.echantillon_mobilier:
          return ApiDbTable.echantillon;
        case ApiDbTable.document_minute:
        case ApiDbTable.document_photo:
          return ApiDbTable.document;
        default:
          return name;
      }
    }
  }

}


export const enum dbStatus {
  init,
  error,
  ready
}
