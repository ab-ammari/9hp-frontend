import {ProjetDataclass} from "./DataClasses/projet-dataclass";
import {StatusInformationDataclass} from "./DataClasses/status-information-dataclass";
import {
  ApiConfigTag,
  ApiDbTable,
  ApiProjectIndex,
  ApiSyncableObject,
  ApiSyncableObjectIndex,
  ApiSyncableType,
  ApiTypeCategory,
  ApiUser,
  TagSystem
} from "../../shared";
import {CastorLinkDataclass, LinkDataclass} from "./DataClasses/CastorLinkDataclass";
import {CastorObjectDataclass, ObjectDataclass} from "./DataClasses/CastorObjectDataclass";
import {ProjectStatsDataclass} from "./DataClasses/project-stats.dataclass";
import {BehaviorSubject, combineLatest, first, of} from "rxjs";
import {DB, dbStatus} from "./Database/DB";
import {UI} from "./util/ui";
import {observe} from "./util/utils";
import {filter, share, tap} from "rxjs/operators";
import {LOG, LoggerContext} from "ngx-wcore";
import {ApplicationContext} from "./DataClasses/application-context";
import {LocalDraftArchive} from "./LocalDraftArchive";

const CONTEXT: LoggerContext = {
  origin: 'RootDataClass'
}

export class RootDataClass {

  projet!: ProjetDataclass;

  links: CastorLinkDataclass;
  objects: CastorObjectDataclass;
  types: ApiSyncableTypeDataclass;

  status: StatusInformationDataclass;
  archive: LocalDraftArchive = new LocalDraftArchive(); // local drafts not yet registered in backend

  objectsToFetch: Array<ApiSyncableObjectIndex> = []; /// objects in index but not yet fetched

  projectStats: ProjectStatsDataclass;

  context: ApplicationContext;

  get user(): ApiUser {
    return this._user;
  }

  get isOwner() {
    return this.projet.selected.item.owner_uuid === this.user.user_uuid;
  }
  private _showAdmin: boolean = false;
  set showAdmin(val: boolean) {
    this._showAdmin = this.isOwner ? val : false;
    UI.state.admin_tools_visible = this._showAdmin;
    this.objects.reload();
  }
  get showAdmin(): boolean {
    return this._showAdmin;
  }

  set user(user: ApiUser) {
    this._user = user;
  }

  private _user: ApiUser;

  get tagSystems():  Array<ApiConfigTag> {
    return this.projet?.selected?.item.config.tags;
  }

  project_index: Array<ApiProjectIndex>;

  constructor() {
    this.setDefault();
  }

  setDefault() {
    this.context = new ApplicationContext();
    this.status = new StatusInformationDataclass();
    this.projet = new ProjetDataclass();
    this.links = new CastorLinkDataclass();
    this.objects = new CastorObjectDataclass();
    this.projectStats = new ProjectStatsDataclass();
    this.types = new ApiSyncableTypeDataclass();

  }

  unselectAll() {
    const activities = this.objects.all.map(
      obj => obj.selected?.onActivity
    ).filter(x => x);
    if (activities && activities.length > 0) {
      /// Wait for all commits to finish properly
      combineLatest(
        activities
      ).pipe(
        filter((values) => {
          return values.every(value => value.size === 0)
        }),
        first(),
        tap(()=> {
          this.objects.all.forEach(object => object.selected?.select(null));
          this.projet.selected?.select(null);
          UI.state.resetStore();
        }),
      ).subscribe();
    }

  }


  isTagSystem(table: ApiDbTable, tagSystem: TagSystem): boolean {
    return this.tagSystems.find(tag => tag.table_name === table).tag_system === tagSystem;
  }


  forTable(table: ApiDbTable): ObjectDataclass<ApiSyncableObject> | LinkDataclass<ApiSyncableObject>  {
    switch (table) {
      case ApiDbTable.contenant:
        return this.objects.contenant;
      case ApiDbTable.document:
      case ApiDbTable.document_photo:
      case ApiDbTable.document_minute:
        return this.objects.document;
      case ApiDbTable.echantillon:
      case ApiDbTable.echantillon_mobilier:
      case ApiDbTable.echantillon_prelevement:
        return this.objects.echantillon;
      case ApiDbTable.ensemble:
        return this.objects.ensemble;
      case ApiDbTable.fait:
        return this.objects.fait;
      case ApiDbTable.gps:
        return this.objects.gps;
      case ApiDbTable.file:
        break;
      case ApiDbTable.link_contenant_echantillon:
        return this.links.link_contenant_echantillon;
      case ApiDbTable.link_document_echantillon:
        return this.links.link_document_echantillon;
      case ApiDbTable.link_document_fait:
       return this.links.link_document_fait;
      case ApiDbTable.link_document_section:
        return this.links.link_document_section;
      case ApiDbTable.link_document_us:
        return this.links.link_document_us;
      case ApiDbTable.link_ensemble_document:
        return this.links.link_ensemble_document;
      case ApiDbTable.link_ensemble_fait:
        return this.links.link_ensemble_fait;
      case ApiDbTable.link_ensemble_us:
        return this.links.link_document_us;
      case ApiDbTable.link_secteur_gps:
        return this.links.link_secteur_gps;
      case ApiDbTable.link_section_ensemble:
        return this.links.link_section_ensemble;
      case ApiDbTable.link_section_fait:
        return this.links.link_section_fait;
      case ApiDbTable.link_section_us:
        return this.links.link_section_us;
      case ApiDbTable.link_topo_document:
        return this.links.link_topo_document;
      case ApiDbTable.link_topo_echantillon:
        return this.links.link_topo_echantillon;
      case ApiDbTable.link_topo_ensemble:
        return this.links.link_topo_ensemble;
      case ApiDbTable.link_topo_fait:
        return this.links.link_topo_fait;
      case ApiDbTable.link_topo_section:
        return this.links.link_topo_section;
      case ApiDbTable.link_topo_us:
        return this.links.link_topo_us;
      case ApiDbTable.mouvement:
        return this.objects.mouvement;
      case ApiDbTable.phase:
        return this.objects.phase;
      case ApiDbTable.projet:
        return this.projet;
      case ApiDbTable.projet_user:
        break;
      case ApiDbTable.secteur:
        return this.objects.secteur;
      case ApiDbTable.section:
      case ApiDbTable.section_sondage:
      case ApiDbTable.section_coupe:
        return this.objects.section;
      case ApiDbTable.stratigraphie:
        return this.objects.stratigraphie;
      case ApiDbTable.type:
        break;
      case ApiDbTable.type_category:
        break;
      case ApiDbTable.user_access:
        break;
      case ApiDbTable.us_construite_materiel:
      case ApiDbTable.us_bati:
      case ApiDbTable.us_construite:
      case ApiDbTable.us_negative:
      case ApiDbTable.us_positive:
      case ApiDbTable.us_squelette:
      case ApiDbTable.us_technique:
      case ApiDbTable.us:
        return this.objects.us;
      case ApiDbTable.us_sous_division:
        break;
      case ApiDbTable.user:
        break;
      case ApiDbTable.topo:
        return this.objects.topo;
    }

    return null;
  }

}


export class ApiSyncableTypeDataclass {

  selected_project_uuid: string;

  get map(): Map<ApiTypeCategory, Array<ApiSyncableType>> {
    return this._types.value;
  }

  get list(): Array<ApiSyncableType> {
    return this._completeList.value;
  }

  private _types: BehaviorSubject<Map<ApiTypeCategory, Array<ApiSyncableType>>>
    = new BehaviorSubject<Map<ApiTypeCategory, Array<ApiSyncableType>>>(new Map<ApiTypeCategory, Array<ApiSyncableType>>())
  private _completeList: BehaviorSubject<Array<ApiSyncableType>> = new BehaviorSubject<Array<ApiSyncableType>>([]);
  private _isInit: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  get isInit() {
    return this._isInit.value;
  }
  onInit() {
    return this._isInit.asObservable().pipe(share(), filter(value => value));
  }
  constructor() {
    this.selected_project_uuid = UI.state.store.projet_uuid;
    DB.database.on_change.pipe(
      filter(event => event.table === 'type'),
      tap((event) => {
        this.init();
      })).subscribe();
    if (DB.database.isReady) {
      this.init();
    } else {
      DB.database.status.pipe(
        filter(status => status === dbStatus.ready),
        tap(() => this.init())
      ).subscribe();
    }

    UI.state.onStoreChange.pipe(
      filter(value => this.selected_project_uuid !== value.projet_uuid),
      tap((value) => {
        this._isInit.next(false);
        this.selected_project_uuid = value.projet_uuid;
        this.init();
      })
    ).subscribe();

  }

  byUuid(uuid: string): ApiSyncableType {
    const type = this.list.find(t => t.type_uuid === uuid);
    return type;
  }

  getByCategory(category: ApiTypeCategory): Array<ApiSyncableType> {
    return this.map.get(category);
  }

  init() {
    if (DB.database?.type?.dexie_table) {
      let obs = observe(
        DB.database.type.dexie_table.filter(type => [null, this.selected_project_uuid].includes(type.projet_uuid)).toArray()
      ).pipe(
        tap((value: Array<ApiSyncableType>) => {
          this._completeList.next(value);
          const types: Map<ApiTypeCategory, Array<ApiSyncableType>> = new Map<ApiTypeCategory, Array<ApiSyncableType>>();
          Object.entries(ApiTypeCategory).forEach(([key, uuid]) => {
            types.set(uuid, value.filter(t => t.type_category_uuid === uuid));
          //  LOG.warn.log({...CONTEXT, action: 'init'}, key, uuid, value, types);
          });
          this._types.next(types);
          this._isInit.next(true);
        })
      );
      obs.subscribe();
      return obs;
    } else {
      LOG.warn.log({...CONTEXT, action: 'init()', message: 'DB is not ready yet.'})
      return of(null);
    }


  }
}



