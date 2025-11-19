import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {dbBoundLink} from "../../../../../../DataClasses/models/db-bound-link";
import {
  ApiContenant,
  ApiDbTable,
  ApiDocumentMinute,
  ApiDocumentPhoto,
  ApiEchantillonMobilier,
  ApiEchantillonPrelevement,
  ApiEnsemble,
  ApiFait,
  ApiSyncableObject,
  ApiTopo,
  ApiUs
} from "../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../DataClasses/models/db-bound-object";
import {tableDescription} from "../../../../../../DataClasses/models/sync-obj-utilities";
import {
  genericTableColumn,
  genericTableDescription, genericTableDescriptionvalueListMapType
} from "../../../../../Display/generic-content-table/links/generic-content-table.component";
import {LOG, LoggerContext} from "ngx-wcore";
import {
  common_headers,
  contenant_headers,
  document_headers,
  echantillon_headers,
  ensemble_headers,
  fait_headers,
  fait_section_headers,
  minute_headers,
  minute_topo_headers,
  mobilier_contenant_headers,
  mobilier_headers,
  prelevement_headers,
  section_headers,
  topo_headers,
  topo_minute_headers,
  us_headers
} from "./genericTableDescriptions";
import {
  getContenantColors,
  getEnsembleColors,
  getFaitColors,
  getMinuteColors,
  getMobilierColors,
  getPhotoColors,
  getPrelevementColors,
  getTopoColors,
  getUSColors
} from "../../../../../../util/castor-object-color-schemes";
import {CastorUtilitiesService} from "../../../../../../services/castor-utilities.service";
import {LinkList} from "../../../../../../services/castor-object-context.service";
import {Subject, timer} from "rxjs";
import {debounce, takeUntil, tap} from "rxjs/operators";

const CONTEXT: LoggerContext = {
  origin: 'CastorLinkListComponent'
}

@Component({
  selector: 'app-castor-link-list',
  templateUrl: './castor-link-list.component.html',
  styleUrls: ['./castor-link-list.component.scss']
})
export class CastorLinkListComponent implements OnInit, OnChanges, OnDestroy {

  @Input() linkList: LinkList;
  ApiDbTable = ApiDbTable;

  table: genericTableDescription = {
    headers: [],
    value_list: [],
    link_list: null
  };


  $subscriber = new Subject();
  $initSubscriber = new Subject();

  onThisInitEvent = new Subject();

  constructor(private utils: CastorUtilitiesService) {
  }

  ngOnInit(): void {
    this.init();
    this.onThisInitEvent.pipe(
      takeUntil(this.$subscriber),
      debounce(() => timer(1000)),
      tap(() => {
        this.init();
      })
    ).subscribe();




  }

  ngOnChanges(changes: SimpleChanges) {
    this.onThisInitEvent.next(null);
  }

  ngOnDestroy() {
    this.$subscriber.next(null);
  }

  init() {
    this.$initSubscriber.next(null);
    const newTable: genericTableDescription = {
      headers: [...common_headers],
      value_list: [],
      link_list: this.linkList
    };
    const tag: genericTableColumn = {origin: 'target', label: 'Numéro', key: 'tag', format: 'tag', color: () => ''};
    const edit: genericTableColumn = {origin: 'relation', label: 'Edit', key: 'edit', format: 'EditRelation'};
    switch (this.linkList.relation.ref_table) {
      case ApiDbTable.link_contenant_echantillon:
        if (this.linkList.target.obj_table === ApiDbTable.echantillon_prelevement) {
          tag.color = (obj) => getPrelevementColors(obj as ApiEchantillonPrelevement);
          newTable.headers = [...newTable.headers, ...prelevement_headers('target'),
            ...echantillon_headers('target')];
        }
        if (this.linkList.target.obj_table === ApiDbTable.echantillon_mobilier) {
          tag.color = (obj) => getMobilierColors(obj as ApiEchantillonMobilier);
          newTable.headers = [...newTable.headers, ...mobilier_headers('target'),
            ...mobilier_contenant_headers('target')];
        }
        if (this.linkList.target.obj_table === ApiDbTable.contenant) {
          if (this.linkList.reference.ref_table === ApiDbTable.echantillon) {
            tag.color = (obj) => getContenantColors(obj as ApiContenant, this.utils);
            newTable.headers = [...newTable.headers, ...contenant_headers('target')];
          }
        }
        break;
      case ApiDbTable.link_document_echantillon:
        if (this.linkList.reference.obj_table === ApiDbTable.document_minute) {
          newTable.headers = [...newTable.headers, ...document_headers('reference'),
            ...minute_headers('reference')];
        }
        if (this.linkList.target.obj_table === ApiDbTable.document_minute) {
          tag.color = (obj) => getMinuteColors(obj as ApiDocumentMinute);
          newTable.headers = [...newTable.headers, ...document_headers('target'),
            ...minute_headers('target')];
        }
        if (this.linkList.target.obj_table === ApiDbTable.document_photo) {
          tag.color = (obj) => getPhotoColors(obj as ApiDocumentPhoto);
          newTable.headers = [...newTable.headers, ...document_headers('target')];
        }
        if (this.linkList.target.obj_table === ApiDbTable.echantillon_mobilier) {
          tag.color = (obj) => getMobilierColors(obj as ApiEchantillonMobilier);
          newTable.headers = [...newTable.headers, ...mobilier_headers('target'),
            ...echantillon_headers('target'),];
        }
        if (this.linkList.target.obj_table === ApiDbTable.echantillon_prelevement) {
          tag.color = (obj) => getPrelevementColors(obj as ApiEchantillonPrelevement);
        }
        break;
      case ApiDbTable.link_document_fait:
        if (this.linkList.reference.obj_table === ApiDbTable.fait) {
          if (this.linkList.target.obj_table === ApiDbTable.document_photo) {
            tag.color = (obj) => getPhotoColors(obj as ApiDocumentPhoto);
            newTable.headers = [...newTable.headers, ...document_headers('target')];
          } else if (this.linkList.target.obj_table === ApiDbTable.document_minute) {
            tag.color = (obj) => getMinuteColors(obj as ApiDocumentMinute);
            newTable.headers = [...newTable.headers, ...minute_headers('relation')];
          }
        }
        if (this.linkList.reference.obj_table === ApiDbTable.document_minute) {
          tag.color = (obj) => getMinuteColors(obj as ApiDocumentMinute);
          newTable.headers = [...newTable.headers, ...minute_headers('relation')];
        }
        if (this.linkList.reference.obj_table === ApiDbTable.document_photo) {
          tag.color = (obj) => getPhotoColors(obj as ApiDocumentPhoto);
          newTable.headers = [...newTable.headers, ...fait_headers('target'),];
        }
        break;
      case ApiDbTable.link_document_section:
        LOG.debug.log({...CONTEXT}, this.linkList.reference);
        if (this.linkList.reference.ref_table === ApiDbTable.section) {
          if (this.linkList.target.obj_table === ApiDbTable.document_minute) {
            tag.color = (obj) => getMinuteColors(obj as ApiDocumentMinute);
            newTable.headers = [...newTable.headers, ...minute_headers('relation')];
          } else {
            tag.color = (obj) => getPhotoColors(obj as ApiDocumentPhoto);
            newTable.headers = [...newTable.headers, ...document_headers('target')];
          }
        }
        if (this.linkList.reference.ref_table === ApiDbTable.document) {
          if (this.linkList.reference.obj_table === ApiDbTable.document_photo) {
            tag.color = (obj) => '#76B99C';
            newTable.headers = [...newTable.headers, ...section_headers('target')];
          }
          if (this.linkList.reference.obj_table === ApiDbTable.document_minute) {
            tag.color = (obj) => getMinuteColors(obj as ApiDocumentMinute);
            newTable.headers = [...newTable.headers, ...minute_headers('relation')];
          }
        }
        break;
      case ApiDbTable.link_document_us:
        if (this.linkList.reference.ref_table === ApiDbTable.us) {
          if (this.linkList.target.obj_table === ApiDbTable.document_minute) {
            tag.color = (obj) => getMinuteColors(obj as ApiDocumentMinute);
            newTable.headers = [...newTable.headers, ...minute_headers('relation')];
          } else {
            tag.color = (obj) => getPhotoColors(obj as ApiDocumentPhoto);
            newTable.headers = [...newTable.headers, ...document_headers('target')];
          }
        }
        if (this.linkList.reference.obj_table === ApiDbTable.document_photo) {
          tag.color = (obj) => getUSColors(obj as ApiUs);
          newTable.headers = [...newTable.headers, ...us_headers('target')];
        }
        if (this.linkList.reference.obj_table === ApiDbTable.document_minute) {
          tag.color = (obj) => getMinuteColors(obj as ApiDocumentMinute);
          newTable.headers = [...newTable.headers, ...minute_headers('relation')];
        }
        break;
      case ApiDbTable.link_ensemble_document:
        if (this.linkList.reference.ref_table === ApiDbTable.ensemble) {
          if (this.linkList.target.obj_table === ApiDbTable.document_minute) {
            tag.color = (obj) => getMinuteColors(obj as ApiDocumentMinute);
            newTable.headers = [...newTable.headers, ...minute_headers('relation')];
          } else {
            tag.color = (obj) => getPhotoColors(obj as ApiDocumentPhoto);
            newTable.headers = [...newTable.headers, ...document_headers('target')];
          }
        }
        if (this.linkList.reference.obj_table === ApiDbTable.document_photo) {
          tag.color = (obj) => getEnsembleColors(obj as ApiEnsemble, this.utils);
          newTable.headers = [...newTable.headers, ...ensemble_headers('target')];
        }
        if (this.linkList.reference.obj_table === ApiDbTable.document_minute) {
          tag.color = (obj) => getMinuteColors(obj as ApiDocumentMinute);
          newTable.headers = [...newTable.headers, ...minute_headers('relation')];
        }
        break;
      case ApiDbTable.link_ensemble_fait:
        if (this.linkList.reference.ref_table === ApiDbTable.fait) {
          tag.color = (obj) => getEnsembleColors(obj as ApiEnsemble, this.utils);
        }
        if (this.linkList.reference.ref_table === ApiDbTable.ensemble) {
          tag.color = (obj) => getFaitColors(obj as ApiFait);
          newTable.headers = [...newTable.headers, ...fait_headers('target')];
        }
        break;
      case ApiDbTable.link_ensemble_us:
        if (this.linkList.reference.ref_table === ApiDbTable.us) {
          tag.color = (obj) => getEnsembleColors(obj as ApiEnsemble, this.utils);
        }
        if (this.linkList.reference.ref_table === ApiDbTable.ensemble) {
          tag.color = (obj) => getUSColors(obj as ApiUs);
          newTable.headers = [...newTable.headers, ...us_headers('target')];
        }
        break;
      case ApiDbTable.link_secteur_gps:
        // TODO: LATER
        break;
      case ApiDbTable.link_section_ensemble:
        // NO RELATION
        if (this.linkList.reference.ref_table === ApiDbTable.ensemble) {
          tag.color = (obj) => '#76B99C';
        } else {
          tag.color = (obj) => getEnsembleColors(obj as ApiEnsemble, this.utils);
        }
        break;
      case ApiDbTable.link_section_fait:
        if (this.linkList.reference.ref_table === ApiDbTable.section) {
          tag.color = (obj) => getFaitColors(obj as ApiFait);
          newTable.headers = [...newTable.headers, ...fait_headers('target')];
        }
        if (this.linkList.reference.ref_table === ApiDbTable.fait) {
          tag.color = (obj) => '#76B99C';
          newTable.headers = [...newTable.headers, ...section_headers('target'),
            ...fait_section_headers('relation')];
        }
        break;
      case ApiDbTable.link_section_us:
        if (this.linkList.reference.ref_table === ApiDbTable.section) {
          tag.color = (obj) => getUSColors(obj as ApiUs);
          newTable.headers = [...newTable.headers, ...us_headers('target')];
        }
        if (this.linkList.reference.ref_table === ApiDbTable.us) {
          tag.color = (obj) => '#76B99C';
          newTable.headers = [...newTable.headers, ...section_headers('target')];
          // TODO: epaisseur ?
        }
        break;
      case ApiDbTable.link_topo_document:
        if (this.linkList.reference.ref_table === ApiDbTable.topo) {
          // TODO : SUJET ?
          if (this.linkList.target.obj_table === ApiDbTable.document_minute) {
            tag.color = (obj) => getMinuteColors(obj as ApiDocumentMinute);
          } else {
            tag.color = (obj) => getPhotoColors(obj as ApiDocumentPhoto);
          }
          newTable.headers = [...newTable.headers, ...minute_topo_headers('target')];
        }
        if (this.linkList.reference.obj_table === ApiDbTable.document_minute) {
          tag.color = (obj) => getTopoColors(obj as ApiTopo);
          newTable.headers = [...newTable.headers, ...topo_minute_headers('target')];
        } else {
          // Photo case
          tag.color = (obj) => getTopoColors(obj as ApiTopo);
        }
        break;
      case ApiDbTable.link_topo_echantillon:
        if (this.linkList.reference.ref_table === ApiDbTable.topo) {
          if (this.linkList.target.obj_table === ApiDbTable.echantillon_prelevement) {
            tag.color = (obj) => getPrelevementColors(obj as ApiEchantillonPrelevement);
            newTable.headers = [...newTable.headers, ...prelevement_headers('target')];
          }
          if (this.linkList.target.obj_table === ApiDbTable.echantillon_mobilier) {
            tag.color = (obj) => getMobilierColors(obj as ApiEchantillonMobilier);
            newTable.headers = [...newTable.headers, ...mobilier_headers('target')];
          }
        }
        if (this.linkList.reference.obj_table === ApiDbTable.echantillon_prelevement) {
          tag.color = (obj) => getTopoColors(obj as ApiTopo);
          newTable.headers = [...newTable.headers, ...topo_headers('target')];
        }
        if (this.linkList.reference.obj_table === ApiDbTable.echantillon_mobilier) {
          tag.color = (obj) => getTopoColors(obj as ApiTopo);
          newTable.headers = [...newTable.headers, ...topo_headers('target')];
        }
        break;
      case ApiDbTable.link_topo_ensemble:
        if (this.linkList.reference.ref_table === ApiDbTable.ensemble) {
          tag.color = (obj) => getTopoColors(obj as ApiTopo);
          newTable.headers = [...newTable.headers, ...topo_headers('target')];
        }
        if (this.linkList.reference.ref_table === ApiDbTable.topo) {
          tag.color = (obj) => getEnsembleColors(obj as ApiEnsemble, this.utils);
          newTable.headers = [...newTable.headers, ...ensemble_headers('target')];
        }
        break;
      case ApiDbTable.link_topo_fait:
        if (this.linkList.reference.ref_table === ApiDbTable.fait) {
          tag.color = (obj) => getTopoColors(obj as ApiTopo);
          newTable.headers = [...newTable.headers, ...topo_headers('target')];
        }
        if (this.linkList.reference.ref_table === ApiDbTable.topo) {
          tag.color = (obj) => getFaitColors(obj as ApiFait);
          newTable.headers = [...newTable.headers, ...fait_headers('target')];
        }
        break;
      case ApiDbTable.link_topo_section:
        if (this.linkList.reference.ref_table === ApiDbTable.topo) {
          tag.color = (obj) => '#76B99C';
          newTable.headers = [...newTable.headers, ...section_headers('target')];
        }
        if (this.linkList.reference.ref_table === ApiDbTable.section) {
          tag.color = (obj) => getTopoColors(obj as ApiTopo);
          newTable.headers = [...newTable.headers, ...topo_headers('target')];
        }
        break;
      case ApiDbTable.link_topo_us:
        if (this.linkList.reference.ref_table === ApiDbTable.us) {
          tag.color = (obj) => getTopoColors(obj as ApiTopo);
          newTable.headers = [...newTable.headers, ...topo_headers('target')];
        }
        if (this.linkList.reference.ref_table === ApiDbTable.topo) {
          tag.color = (obj) => getUSColors(obj as ApiUs);
          newTable.headers = [...newTable.headers, ...us_headers('target')];
        }
        break;
      default: // not a link :(
        console.log('TOO BAD BRO :(');
        break;
    }


    newTable.headers.push(edit);
    this.linkList.list.forEach(item => {
      const map: Map<string, genericTableDescriptionvalueListMapType> = new Map();
      newTable.headers.forEach(header => {
        switch (header.origin) {
          case "reference":
            map.set(header.key, item.reference.item[header.key]);
            break;
          case "target":
            map.set(header.key, item.target.item[header.key]);
            break;
          case "relation":
            if (header.key === 'edit') {
              map.set(header.key, item);
            } else {
              map.set(header.key, item.relation.item[header.key]);
            }
            break;
        }

        item.relation.onValueChange().pipe(
          takeUntil(this.$initSubscriber),
          tap(() => this.onThisInitEvent.next(null))
        ).subscribe();

      });

      LOG.debug.log({...CONTEXT}, newTable, map, item);
      newTable.value_list.push(map);
    });

    newTable.headers.unshift(tag);

    this.table = newTable;
  }

}
