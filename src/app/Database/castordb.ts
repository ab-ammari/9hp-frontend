import {Table} from 'dexie';
import 'dexie-observable';
import {LOG, LoggerContext} from "ngx-wcore";
import {
  ApiContenant,
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
  ApiStratigraphie, ApiSyncableFile, ApiSyncableType,
  ApiTopo,
  ApiUs,
} from "../../../shared";
import {castor_schema} from "./schema";
import {Abstractdb} from "./abstractdb";
import {castor_standard_types} from "../../../shared/objects/models/StandardTypes";
import {debounceTime, take, tap, throttle, throttleTime} from "rxjs/operators";

const CONTEXT: LoggerContext = {
  origin: 'Castordb'
}


export class Castordb extends Abstractdb {

  /**
   * Tables
   */

    /// MAIN
  projet: Table<ApiProjet, string>;

  /// TYPES
  type: Table<ApiSyncableType, string>;

  /// TYPES
  file: Table<ApiSyncableFile, string>;

  /// OBJECTS
  secteur: Table<ApiSecteur, string>;
  us: Table<ApiUs, string>;
  fait: Table<ApiFait, string>;
  contenant: Table<ApiContenant, string>;
  document: Table<ApiDocument, string>;
  ensemble: Table<ApiEnsemble, string>;
  gps: Table<ApiGps, string>;
  echantillon: Table<ApiEchantillon, string>;
  mouvement: Table<ApiMouvement, string>;
  phase: Table<ApiPhase, string>;
  section: Table<ApiSection, string>;
  stratigraphie: Table<ApiStratigraphie, string>;
  topo: Table<ApiTopo, string>;

  /// RELATIONSHIPS
  document_echantillon: Table<ApiLinkDocumentEchantillon, string>;
  document_fait: Table<ApiLinkDocumentFait, string>;
  document_section: Table<ApiLinkDocumentSection, string>;
  document_us: Table<ApiLinkDocumentUs, string>;
  ensemble_document: Table<ApiLinkDocumentEnsemble, string>;
  topo_document: Table<ApiLinkDocumentTopo, string>;
  topo_echantillon: Table<ApiLinkTopoEchantillon, string>;
  topo_ensemble: Table<ApiLinkTopoEnsemble, string>;
  topo_fait: Table<ApiLinkTopoFait, string>;
  topo_section: Table<ApiLinkTopoSection, string>;
  topo_us: Table<ApiLinkTopoUs, string>;
  section_ensemble: Table<ApiLinkSectionEnsemble, string>;
  section_fait: Table<ApiLinkSectionFait, string>;
  section_us: Table<ApiLinkSectionUs, string>;
  ensemble_fait: Table<ApiLinkEnsembleFait, string>;
  ensemble_us: Table<ApiLinkEnsembleUs, string>;
  secteur_gps: Table<ApiLinkSecteurGps, string>;
  contenant_echantillon: Table<ApiLinkContenantEchantillon, string>;


  constructor(DbName: string) {
    super(DbName);
    LOG.debug.log({...CONTEXT, action: DbName + ':::constructor'});

    this.setup();
    this.on_close.pipe(
      throttleTime(1000),
      tap(() => this.setup())
    ).subscribe();
  }

   private setup() {

    LOG.debug.log({...CONTEXT, action: 'castorDBSetup'}, castor_schema);
    this.version(1).stores(castor_schema);
    this.version(4).stores(castor_schema).upgrade(() => {
      this.type.clear().then(async () => {
          await Promise.all(castor_standard_types.map(async (type) => {
            LOG.debug.log({...CONTEXT, action: 'init DB with type '}, type);
            await this.type.put(type, type.type_uuid);
          }));
      });
    });

    this.on_populate.subscribe(async () => {
      // preload basic types
      await Promise.all(castor_standard_types.map(async (type) => {
        LOG.debug.log({...CONTEXT, action: 'populate DB with type '}, type);
        await this.type.put(type, type.type_uuid);
      }));
    });

     this.open();
   }
}
