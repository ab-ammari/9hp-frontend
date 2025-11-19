import {LoggerContext} from "ngx-wcore";
import {
  ApiDbTable,
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
  ApiSyncableObject
} from "../../../shared";
import {DB} from "../Database/DB";
import {castorAbstractLinkDataclass} from "./models/castor-abstract-link-data-class";

const CONTEXT: LoggerContext = {
  origin: 'CastorLinkDataclass'
}

export class CastorLinkDataclass {
  get list(): Array<LinkDataclass<ApiSyncableObject>> {
    return [
      this.link_ensemble_us,
      this.link_document_echantillon,
      this.link_document_fait,
      this.link_document_section,
      this.link_document_us,
      this.link_ensemble_document,
      this.link_topo_document,
      this.link_topo_ensemble,
      this.link_topo_echantillon,
      this.link_topo_fait,
      this.link_topo_section,
      this.link_topo_us,
      this.link_section_ensemble,
      this.link_section_fait,
      this.link_section_us,
      this.link_ensemble_fait,
      this.link_secteur_gps,
      this.link_contenant_echantillon
    ];
  }

  link_ensemble_us: LinkDataclass<ApiLinkEnsembleUs> = new LinkDataclass(ApiDbTable.link_ensemble_us);
  link_document_echantillon: LinkDataclass<ApiLinkDocumentEchantillon> = new LinkDataclass(ApiDbTable.link_document_echantillon);
  link_document_fait: LinkDataclass<ApiLinkDocumentFait> = new LinkDataclass(ApiDbTable.link_document_fait);
  link_document_section: LinkDataclass<ApiLinkDocumentSection> = new LinkDataclass(ApiDbTable.link_document_section);
  link_document_us: LinkDataclass<ApiLinkDocumentUs> = new LinkDataclass(ApiDbTable.link_document_us);
  link_ensemble_document: LinkDataclass<ApiLinkDocumentEnsemble> = new LinkDataclass(ApiDbTable.link_ensemble_document);
  link_topo_document: LinkDataclass<ApiLinkDocumentTopo> = new LinkDataclass(ApiDbTable.link_topo_document);
  link_topo_echantillon: LinkDataclass<ApiLinkTopoEchantillon> = new LinkDataclass(ApiDbTable.link_topo_echantillon);
  link_topo_ensemble: LinkDataclass<ApiLinkTopoEnsemble> = new LinkDataclass(ApiDbTable.link_topo_ensemble);
  link_topo_fait: LinkDataclass<ApiLinkTopoFait> = new LinkDataclass(ApiDbTable.link_topo_fait);
  link_topo_section: LinkDataclass<ApiLinkTopoSection> = new LinkDataclass(ApiDbTable.link_topo_section);
  link_topo_us: LinkDataclass<ApiLinkTopoUs> = new LinkDataclass(ApiDbTable.link_topo_us);
  link_section_ensemble: LinkDataclass<ApiLinkSectionEnsemble> = new LinkDataclass(ApiDbTable.link_section_ensemble);
  link_section_fait: LinkDataclass<ApiLinkSectionFait> = new LinkDataclass(ApiDbTable.link_section_fait);
  link_section_us: LinkDataclass<ApiLinkSectionUs> = new LinkDataclass(ApiDbTable.link_section_us);
  link_ensemble_fait: LinkDataclass<ApiLinkEnsembleFait> = new LinkDataclass(ApiDbTable.link_ensemble_fait);
  link_secteur_gps: LinkDataclass<ApiLinkSecteurGps> = new LinkDataclass(ApiDbTable.link_secteur_gps);
  link_contenant_echantillon: LinkDataclass<ApiLinkContenantEchantillon> = new LinkDataclass(ApiDbTable.link_contenant_echantillon);

  constructor() {

  }

  setDefault() {
  }
}

export class LinkDataclass<T extends ApiSyncableObject> extends castorAbstractLinkDataclass<T> {
  get db() {
    return DB.database[this.info.obj_table];
  }

  constructor(protected table: ApiDbTable) {
    super(table);
  }
}
