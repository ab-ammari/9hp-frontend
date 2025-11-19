import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges,} from '@angular/core';
import {
  ApiContenant,
  ApiDbTable, ApiDocumentMinute, ApiDocumentPhoto,
  ApiEchantillonMobilier, ApiEchantillonPrelevement,
  ApiEnsemble,
  ApiFait,
  ApiSecteur,
  ApiSyncableObject, ApiTopo,
  ApiUs
} from "../../../../../shared";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {dbBoundObjectList} from "../../../DataClasses/models/db-bound-object-list";
import {dbBoundLinkList} from "../../../DataClasses/models/db-bound-link-list";
import {LOG, LoggerContext} from "ngx-wcore";
import {
  genericContentDescription,
  genericContentHeaderDescription
} from "../generic-content-table/objects/generic-content-object-table.component";
import {Subject} from "rxjs";
import {
  getContenantColors,
  getEnsembleColors,
  getFaitColors, getMinuteColors, getMobilierColors, getPhotoColors, getPrelevementColors,
  getSectorColors, getTopoColors,
  getUSColors
} from "../../../util/castor-object-color-schemes";
import {CastorUtilitiesService} from "../../../services/castor-utilities.service";
import {WorkerService} from "../../../services/worker.service";

const CONTEXT: LoggerContext = {
  origin: 'CastorItemsListComponent'
}

@Component({
  selector: 'app-castor-items-list',
  templateUrl: './castor-items-list.component.html',
  styleUrls: ['./castor-items-list.component.scss']
})
export class CastorItemsListComponent implements OnInit, OnChanges, OnDestroy {

  @Input() set filterChild(child: ApiDbTable) {
    if (this.child !== child) {
      this.child = child;
      LOG.debug.log({...CONTEXT, action: 'filterChild updated'}, {child});
      this.refreshContent('filterChild');
    }
  };

  @Input() global_search: string;
  @Input() document_view: boolean = false;

  child: ApiDbTable = null;

  @Input() set list(list: Array<dbBoundObject<ApiSyncableObject>>) {
    const clonedList = list ? [...list] : [];
    LOG.debug.log({...CONTEXT, action: 'incoming list'}, {size: clonedList.length});
    this.rawList = clonedList;
    this.refreshContent('list');
  };

  items: Array<dbBoundObject<ApiSyncableObject>> = [];

  @Output() detailsCallBack = new EventEmitter();
  @Output() btnDeleteCallback = new EventEmitter();

  ApiDbTable = ApiDbTable;


  content: genericContentDescription;
  $subscriber: Subject<boolean> = new Subject<boolean>();
  private rawList: Array<dbBoundObject<ApiSyncableObject>> = [];
  private refTable: ApiDbTable = null;
  private lastStableList: Array<dbBoundObject<ApiSyncableObject>> = [];
  listReady = false;
  private displaySource: 'incoming' | 'stable' | 'empty' = 'empty';

  constructor(private utils: CastorUtilitiesService, public w: WorkerService) {
  }

  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges) {

  }

  ngOnDestroy() {
    this.$subscriber.next(true);
  }

  init() {
    LOG.debug.log({...CONTEXT, action: 'init state'}, {
      ready: this.listReady,
      refTable: this.refTable,
      displaySource: this.displaySource,
      displayedItems: this.items?.length ?? 0
    });
    this.content = null;
    if (this.items?.length > 0) {
      const tag: genericContentHeaderDescription = {label: 'Numéro', key: 'tag', format: 'tag', color: () => ''};
      let headers: Array<genericContentHeaderDescription> = [];

      if (this.items[0].info.ref_table === ApiDbTable.us) {
        tag.color = (obj) => getUSColors(obj as ApiUs);
        headers.push(
          {key: 'secteur_uuid', format: 'SECTOR', label: 'Secteur'},
          {key: 'us_uuid', format: 'usFait', label: 'FAIT'},
          {key: ApiDbTable.link_ensemble_us, format: 'LINK_LIST', label: 'Ensembles'},
          {key: 'label', format: 'info', label: 'Type'},
          {key: 'us_identification_uuid', format: 'type', label: 'Identification'},
          {key: 'us_description', format: 'string', label: 'Description'},
          //{key: 'us_uuid', specialDisplay: 'usDatation', label: 'Datation (mobilier)'},
          {key: ApiDbTable.link_document_us, format: 'LINK_LIST', label: 'Minutes/Photos'}
        );
      } else if (this.items[0].info.ref_table === ApiDbTable.section) {
        tag.color = (obj) => '#76B99C';
        headers.push(
          {key: 'section_type', format: 'type', label: 'Type'},
          {key: ApiDbTable.link_section_fait, format: 'LINK_LIST', label: 'FAITS'},
          {key: ApiDbTable.link_section_us, format: 'LINK_LIST', label: 'US'},
          {key: 'section_notes', format: 'string', label: 'Remarques'});
      } else {
        switch (this.items[0].info.obj_table) {
          case ApiDbTable.secteur:
            tag.color = (obj) => getSectorColors(obj as ApiSecteur, this.utils);
            headers.push({key: 'responsable', format: 'user', label: 'Responsable'});
            headers.push({key: 'secteur_uuid', specialDisplay: 'synthese', label: 'Synthèse'});
            break;
          case ApiDbTable.fait:
            tag.color = (obj) => getFaitColors(obj as ApiFait);
            headers.push(
              {key: 'secteur_uuid', format: 'SECTOR', label: 'Secteur'},
              {key: 'fait_identification_uuid', format: 'type', label: 'Identification'},
              // {key: 'fait_uuid', specialDisplay: 'faitDatation', label: 'Datation (mobilier)'},
              {key: 'fait_description', format: 'string', label: 'Description'},
              {key: ApiDbTable.link_ensemble_fait, format: 'LINK_LIST', label: 'Ensembles'},
              {key: ApiDbTable.link_document_fait, format: 'LINK_LIST', label: 'Minute/Photo'}
            );
            break;
          case ApiDbTable.ensemble:
            tag.color = (obj) => getEnsembleColors(obj as ApiEnsemble, this.utils);
            headers.push(
              {key: 'ensemble_identification_uuid', format: 'type', label: 'Identification'},
              {key: ApiDbTable.link_ensemble_fait, format: 'LINK_LIST', label: 'Faits'},
              {key: ApiDbTable.link_ensemble_us, format: 'LINK_LIST', label: 'US'},
              {key: 'ensemble_description', format: 'string', label: 'Description'},
              {key: 'ensemble_datation_uuid', format: 'type', label: 'Datation'}
              );
            break;
          case ApiDbTable.echantillon_mobilier:
            tag.color = (obj) => getMobilierColors(obj as ApiEchantillonMobilier);
            headers.push(
              /*{key: 'secteur_uuid', format: 'SECTOR', label: 'Secteur'},*/
              {key: 'mobilier_type_uuid', format: 'type', label: 'Type'},
              {key: 'us_uuid', format: 'usFait', label: 'FAIT'},
              {key: 'us_uuid', format: 'US', label: 'US'},
          //    {key: ApiDbTable.link_section_echantillon, format: 'LINK_LIST', label: 'Sondage'},
              {key: 'type_materiaux_uuid', format: 'type', label: 'Matériau'},
              /*{key: 'mobilier_nr', format: 'string', label: 'NR'},
              {key: 'mobilier_pr', format: 'string', label: 'PR'},*/
              {key: 'mobilier_identification_uuid', format: 'type', label: 'Identification'},
              {key: ApiDbTable.link_contenant_echantillon, format: 'LINK_LIST', label: 'Contenants'}
            );
            break;
          case ApiDbTable.echantillon_prelevement:
            tag.color = (obj) => getPrelevementColors(obj as ApiEchantillonPrelevement);
            headers.push(
              /*{key: 'secteur_uuid', format: 'SECTOR', label: 'Secteur'},*/
              {key: 'us_uuid', format: 'usFait', label: 'FAIT'},
              {key: 'us_uuid', format: 'US', label: 'US'},
            //  {key: ApiDbTable.link_section_echantillon, format: 'LINK_LIST', label: 'Sondage'},
              {key: 'type_nature_uuid', format: 'type', label: 'Nature'},
              //{key: 'prelevement_quantite', format: 'type', label: 'Quantitié'},
              {key: 'prelevement_analyse', format: 'type', label: 'Analyse'},
              {key: ApiDbTable.link_contenant_echantillon, format: 'LINK_LIST', label: 'Contenants'}
            );
            break;
          case ApiDbTable.contenant:
            tag.color = (obj) => getContenantColors(obj as ApiContenant, this.utils);
            headers.push(
              {key: 'type_contenant_uuid', format: 'type', label: 'Type'},
              {key: 'contenant_uuid', specialDisplay: 'contenu', label: 'Contenu'},
              {key: 'contenant_total_weight', format: 'number', label: 'Poids total (kg)'},
             /* {key: 'contenant_superieur_uuid', format: 'string', label: 'Contenant supérieur'},*/
              {key: 'contenant_remarques', format: 'string', label: 'Remarques'},
            );
            break;
          case ApiDbTable.document_minute:
            tag.color = (obj) => getMinuteColors(obj as ApiDocumentMinute);
            headers.push(
              {key: 'document_file_uuid', format: 'image', label: 'Aperçu'},
              {key: 'minute_support', format: 'type', label: 'Support'},
              {key: 'document_remarques', format: 'string', label: 'Remarques'},
              {key: 'author_uuid', specialDisplay: 'author', label: 'Auteur'},
            );
            break;
          case ApiDbTable.document_photo:
            tag.color = (obj) => getPhotoColors(obj as ApiDocumentPhoto);
            headers.push(
              {key: 'document_file_uuid', format: 'image', label: 'Aperçu'},
              {key: 'photo_type_uuid', format: 'type', label: 'Type'},
              /*{key: 'photo_state_uuid', format: 'type', label: 'Etat'},*/
              {key: 'photo_vue_vers', format: 'type', label: 'Vue'},
              {key: 'photo_plaque', format: 'boolean', label: 'Plaque'},
              {key: 'author_uuid', specialDisplay: 'author', label: 'Auteur'}
            );
            break;
          case ApiDbTable.topo:
            tag.color = (obj) => getTopoColors(obj as ApiTopo);
            headers.push(
              {key: 'topo_type_uuid', format: 'type', label: 'Type'},
              {key: 'topo_loc_x', format: 'number', label: 'x'},
              {key: 'topo_loc_y', format: 'number', label: 'y'},
              {key: 'topo_loc_z', format: 'number', label: 'z'},
              {key: 'topo_levee', format: 'boolean', label: 'Levée'},
            );
            break;
        }
      }
      headers.unshift(tag);
      // headers.push({key: 'note', format: 'string', label: 'Note'}); Don't know what it is
      this.content = {
        headers: headers,
        content: this.items
      };
    }
  }

  isUsDb(): boolean {
    return ((this.items[0]?.item?.table === ApiDbTable.us)
      || (this.items[0]?.item?.table === ApiDbTable.us_technique)
      || (this.items[0]?.item?.table === ApiDbTable.us_construite)
      || (this.items[0]?.item?.table === ApiDbTable.us_negative)
      || (this.items[0]?.item?.table === ApiDbTable.us_positive)
      || (this.items[0]?.item?.table === ApiDbTable.us_bati)
      || (this.items[0]?.item?.table === ApiDbTable.us_squelette));
  }

  handleDetailsClick(object: ApiSyncableObject) {
    this.detailsCallBack.emit(object)
  }

  handleBtnDeleteClick(object: ApiSyncableObject) {
    this.btnDeleteCallback.emit(object)
  }

  private refreshContent(origin: 'list' | 'filterChild') {
    const filteredList = this.applyChildFilter(this.rawList);
    const normalizedList = this.normalizeList(filteredList);
    const resolvedRefTable = this.resolveRefTable(normalizedList);
    this.updateListReadiness(resolvedRefTable);
    const displayList = this.buildDisplayList(normalizedList);

    LOG.debug.log({...CONTEXT, action: 'selected source'}, {
      origin,
      refTable: this.refTable,
      ready: this.listReady,
      source: this.displaySource,
      incomingSize: filteredList.length,
      normalizedSize: normalizedList.length,
      displaySize: displayList.length
    });

    this.items = displayList;
    this.init();
  }

  private applyChildFilter(list: Array<dbBoundObject<ApiSyncableObject>>): Array<dbBoundObject<ApiSyncableObject>> {
    if (!list) {
      return [];
    }
    if (!this.child) {
      return [...list];
    }
    return list.filter(item => item.info.obj_table === this.child);
  }

  private normalizeList(
    list: Array<dbBoundObject<ApiSyncableObject>>
  ): Array<dbBoundObject<ApiSyncableObject>> {
    if (!list?.length) {
      return [];
    }

    type VersionRecord = {
      entry: dbBoundObject<ApiSyncableObject>,
      index: number,
      created: number
    };

    const latestByUuid: Map<string, VersionRecord> = new Map<string, VersionRecord>();
    let fallbackCounter = 0;

    list.forEach((item, index) => {
      if (!item) {
        return;
      }

      const uuidPath = item.info?.uuid_paths?.[0];
      const uuid = item.uuid ?? (uuidPath ? item.item?.[uuidPath] : null);

      if (!uuid) {
        const syntheticKey = `__synthetic_${fallbackCounter++}`;
        latestByUuid.set(syntheticKey, {
          entry: item,
          index,
          created: item.item?.created ?? 0
        });
        return;
      }

      const existing = latestByUuid.get(uuid);
      const created = item.item?.created ?? 0;

      if (!existing) {
        latestByUuid.set(uuid, {entry: item, index, created});
        return;
      }

      if (created >= existing.created) {
        latestByUuid.set(uuid, {entry: item, index: existing.index, created});
      }
    });

    if (latestByUuid.size === list.length) {
      return [...list];
    }

    const deduplicated = Array.from(latestByUuid.values())
      .sort((a, b) => a.index - b.index)
      .map(record => record.entry);

    LOG.debug.log({...CONTEXT, action: 'normalizeList'}, {
      originalSize: list.length,
      dedupedSize: deduplicated.length
    });

    return deduplicated;
  }

  private resolveRefTable(list: Array<dbBoundObject<ApiSyncableObject>>): ApiDbTable | null {
    const currentRef = list?.[0]?.info?.ref_table
      ?? this.lastStableList?.[0]?.info?.ref_table
      ?? this.refTable;
    this.refTable = currentRef;
    LOG.debug.log({...CONTEXT, action: 'resolveRefTable'}, {
      refTable: currentRef,
      hasList: list?.length ?? 0,
      hasStable: this.lastStableList?.length ?? 0
    });
    return currentRef ?? null;
  }

  private updateListReadiness(table: ApiDbTable | null) {
    if (!table) {
      this.listReady = false;
      return;
    }
    const candidate = this.w.data().forTable(table);
    const listStore = candidate?.all as dbBoundObjectList<ApiSyncableObject> | dbBoundLinkList<ApiSyncableObject> | undefined;

    if (this.isObjectStore(listStore)) {
      this.listReady = listStore.isReady;
    } else {
      this.listReady = !!listStore;
    }
    LOG.debug.log({...CONTEXT, action: 'list readiness'}, {
      table,
      ready: this.listReady
    });
  }

  private buildDisplayList(list: Array<dbBoundObject<ApiSyncableObject>>): Array<dbBoundObject<ApiSyncableObject>> {
    if (this.listReady) {
      const readyList = [...(list ?? [])];
      if (readyList.length === 0) {
        this.lastStableList = [];
        this.displaySource = 'empty';
        return [];
      }
      this.lastStableList = [...readyList];
      this.displaySource = 'incoming';
      return [...readyList];
    }

    if (this.lastStableList?.length > 0) {
      this.displaySource = 'stable';
      return [...this.lastStableList];
    }

    const fallback = [...(list ?? [])];
    this.displaySource = fallback.length > 0 ? 'incoming' : 'empty';
    return fallback;
  }

  private isObjectStore(
    store: dbBoundObjectList<ApiSyncableObject> | dbBoundLinkList<ApiSyncableObject> | undefined
  ): store is dbBoundObjectList<ApiSyncableObject> {
    return !!store && typeof (store as dbBoundObjectList<ApiSyncableObject>).isReady === 'boolean';
  }

}
