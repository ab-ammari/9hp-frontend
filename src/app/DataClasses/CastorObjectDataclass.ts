import {LoggerContext} from "ngx-wcore";
import {
  ApiContenant,
  ApiDbTable,
  ApiDocument,
  ApiEchantillon,
  ApiEnsemble,
  ApiFait,
  ApiGps,
  ApiMouvement,
  ApiPhase,
  ApiSecteur,
  ApiSection,
  ApiStratigraphie,
  ApiSyncableObject,
  ApiTopo,
  ApiUs
} from "../../../shared";
import {DB} from "../Database/DB";
import {castorAbstractObjectDataClass} from "./models/castor-abstract-object-data-class";
import {BehaviorSubject, combineLatest, Subject} from "rxjs";
import {Observable} from "rxjs";
import {getTableDescription, tableDescription} from "./models/sync-obj-utilities";
import {filter, map} from "rxjs/operators";

const CONTEXT: LoggerContext = {
  origin: 'CastorObjectDataclass'
}

export class CastorObjectDataclass {

  get all(): Array<ObjectDataclass<ApiSyncableObject>> {
    return [
      this.secteur,
      this.us,
      this.fait,
      this.contenant,
      this.document,
      this.ensemble,
      this.gps,
      this.echantillon,
      this.mouvement,
      this.phase,
      this.section,
      this.stratigraphie,
      this.topo,
    ];
  }



  secteur: ObjectDataclass<ApiSecteur> = new ObjectDataclass<ApiSecteur>(ApiDbTable.secteur);
  us: ObjectDataclass<ApiUs> = new ObjectDataclass<ApiUs>(ApiDbTable.us);
  fait: ObjectDataclass<ApiFait> = new ObjectDataclass<ApiFait>(ApiDbTable.fait);
  contenant: ObjectDataclass<ApiContenant> = new ObjectDataclass<ApiContenant>(ApiDbTable.contenant);
  document: ObjectDataclass<ApiDocument> = new ObjectDataclass<ApiDocument>(ApiDbTable.document);
  ensemble: ObjectDataclass<ApiEnsemble> = new ObjectDataclass<ApiEnsemble>(ApiDbTable.ensemble);
  gps: ObjectDataclass<ApiGps> = new ObjectDataclass<ApiGps>(ApiDbTable.gps);
  echantillon: ObjectDataclass<ApiEchantillon> = new ObjectDataclass<ApiEchantillon>(ApiDbTable.echantillon);
  mouvement: ObjectDataclass<ApiMouvement> = new ObjectDataclass<ApiMouvement>(ApiDbTable.mouvement);
  phase: ObjectDataclass<ApiPhase> = new ObjectDataclass<ApiPhase>(ApiDbTable.phase);
  section: ObjectDataclass<ApiSection> = new ObjectDataclass<ApiSection>(ApiDbTable.section);
  stratigraphie: ObjectDataclass<ApiStratigraphie> = new ObjectDataclass<ApiStratigraphie>(ApiDbTable.stratigraphie);
  topo: ObjectDataclass<ApiTopo> = new ObjectDataclass<ApiTopo>(ApiDbTable.topo);

  onObjectsChange: Subject<ObjectDataclass<ApiSyncableObject>> = new Subject<ObjectDataclass<ApiSyncableObject>>();


  get isReady() {
    return this.all.every(obj => obj.isReady);
  }
  get onReady() {
    return combineLatest(this.all.map(val => val.onReady())).pipe(
      filter(value => value.every(val => val)),
      map(val => true)
    );
  }
  public get onInit(): Observable<boolean> {
    return this._isInit.asObservable();
  }

  public get isInit(): boolean {
    return this._isInit.value;
  }

  reload() {
    this.all.forEach(obj => {
      obj.init();
    })
  }

  private _isInit: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() {
    const subs: Array<Observable<boolean>> = this.all.map(obj => obj.onInit);
    combineLatest(subs).subscribe(next => {
      const isAllInit: boolean = !next.some(value => !value);
      this._isInit.next(isAllInit);
      if (isAllInit) {
        this.all.forEach(obj => {
          obj.all.onValueChange().subscribe(() => this.onObjectsChange.next(obj));
        });
      }
    });
  }

  selectObject(object: ApiSyncableObject) {
    const info: tableDescription = getTableDescription(object.table);
    return this.all.find(obj => obj.table === info.ref_table).selected.select(object[info.uuid_paths[0]]);
  }

  setDefault() {
  }


}

export class ObjectDataclass<T extends ApiSyncableObject> extends castorAbstractObjectDataClass<T> {
  get db() {
    return DB.database[this.info.ref_table];
  }

  constructor(public table: ApiDbTable) {
    super(table);
  }

  setDefault() {
  }


}

