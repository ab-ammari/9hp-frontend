import {ApiDbTable, ApiLinkTopoFait, ApiSyncableObject, ApiTopo, TagSystem} from "../../../../shared";
import {firstValueFrom, Observable, of} from "rxjs";
import {DB} from "../DB";
import {mergeMap, tap} from "rxjs/operators";


export class MiddlewareRouter {


  static route(object: ApiSyncableObject, TagSystem): Observable<unknown> {
    switch (object.table) {
      case ApiDbTable.contenant:
        break;
      case ApiDbTable.document:
        break;
      case ApiDbTable.document_photo:
        break;
      case ApiDbTable.document_minute:
        break;
      case ApiDbTable.echantillon:
        break;
      case ApiDbTable.echantillon_mobilier:
        break;
      case ApiDbTable.echantillon_prelevement:
        break;
      case ApiDbTable.ensemble:
        break;
      case ApiDbTable.fait:
        break;
      case ApiDbTable.gps:
        break;
      case ApiDbTable.file:
        break;
      case ApiDbTable.link_contenant_echantillon:
        break;
      case ApiDbTable.link_document_echantillon:
        break;
      case ApiDbTable.link_document_fait:
        break;
      case ApiDbTable.link_document_section:
        break;
      case ApiDbTable.link_document_us:
        break;
      case ApiDbTable.link_ensemble_document:
        break;
      case ApiDbTable.link_ensemble_fait:
        break;
      case ApiDbTable.link_ensemble_us:
        break;
      case ApiDbTable.link_secteur_gps:
        break;
      case ApiDbTable.link_section_echantillon:
        break;
      case ApiDbTable.link_section_ensemble:
        break;
      case ApiDbTable.link_section_fait:
        break;
      case ApiDbTable.link_section_us:
        break;
      case ApiDbTable.link_topo_document:
        break;
      case ApiDbTable.link_topo_echantillon:
        break;
      case ApiDbTable.link_topo_ensemble:
        break;
      case ApiDbTable.link_topo_fait:
        const link: ApiLinkTopoFait = object as ApiLinkTopoFait;
        DB.database.topo.get(link.topo_uuid).pipe(
          tap((topo: ApiTopo) => {
            if (!topo.fait_uuid) {
              topo.fait_uuid = link.fait_uuid;
              DB.database.topo.save(topo);
            }
          })
        );
        break;
      case ApiDbTable.link_topo_section:
        break;
      case ApiDbTable.link_topo_us:
        break;
      case ApiDbTable.mouvement:
        break;
      case ApiDbTable.phase:
        break;
      case ApiDbTable.projet:
        break;
      case ApiDbTable.projet_user:
        break;
      case ApiDbTable.secteur:
        break;
      case ApiDbTable.section:
        break;
      case ApiDbTable.section_sondage:
        break;
      case ApiDbTable.section_coupe:
        break;
      case ApiDbTable.stratigraphie:
        break;
      case ApiDbTable.type:
        break;
      case ApiDbTable.type_category:
        break;
      case ApiDbTable.user_access:
        break;
      case ApiDbTable.us:
        break;
      case ApiDbTable.us_sous_division:
        break;
      case ApiDbTable.us_construite_materiel:
        break;
      case ApiDbTable.us_bati:
        break;
      case ApiDbTable.us_construite:
        break;
      case ApiDbTable.us_negative:
        break;
      case ApiDbTable.us_positive:
        break;
      case ApiDbTable.us_squelette:
        break;
      case ApiDbTable.us_technique:
        break;
      case ApiDbTable.user:
        break;
      case ApiDbTable.topo:
        break;
    }
    return of(true);
  }



}




