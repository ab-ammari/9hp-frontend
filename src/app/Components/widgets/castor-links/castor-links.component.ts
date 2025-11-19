import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
  ApiDbTable,
  ApiEchantillon,
  ApiFait,
  ApiSecteur,
  ApiSection,
  ApiSyncableObject,
  ApiTopo,
  ApiUs
} from "../../../../../shared";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {LOG, LoggerContext} from "ngx-wcore";
import {WorkerService} from "../../../services/worker.service";

import {ModalDismissObject, ModalService, OverlayEventDetailData} from "../../../services/modal.service";
import {createNewLinkInDb} from "../../../util/utils";
import {CastorObjectContextService, LinkSelection} from "../../../services/castor-object-context.service";
import {LinkEditingModalComponent} from "../link-editing-modal/link-editing-modal.component";
import {IonFab, ModalController} from "@ionic/angular";
import {debounceTime, take, takeUntil, tap} from "rxjs/operators";
import {first, Observable, Subject, throwError} from "rxjs";

const CONTEXT: LoggerContext = {
  origin: 'CastorLinksComponent'
}

@Component({
  selector: 'app-castor-links',
  templateUrl: './castor-links.component.html',
  styleUrls: ['./castor-links.component.scss']
})
export class CastorLinksComponent implements OnInit, OnDestroy {

  availableApiLinkSelections: Set<LinkSelection> = new Set<LinkSelection>([]);

  @Input() object: dbBoundObject<ApiSyncableObject>;
  @ViewChild("fabCreateObject") fabCreateObject: IonFab;

  set selection(val: LinkSelection) {
    this.w.data().context.linkSelection = val;
  };

  get selection(): LinkSelection {
    return this.w.data().context.linkSelection;
  }

  get isDetailsSelection(): boolean {
    return this.selection?.id === 'details';
  }

  displayAddNewObjectBtn: boolean = true;

  isProjectOwner: boolean = false;
  private destroy$: Subject<void> = new Subject<void>();
  constructor(
    public w: WorkerService,
    private modalService: ModalService,
    private castorObjectContext: CastorObjectContextService,
    private modalCtrl: ModalController
  ) {

  }

  ngOnInit(): void {
    LOG.debug.log({...CONTEXT, action: 'ngOnInit'});
    this.w.data().objects.onReady.pipe(
      first(),
      takeUntil(this.destroy$),
      tap((value) => {
        this.availableApiLinkSelections = this.castorObjectContext.ObjectLinkContext(this.object);
        LOG.debug.log({...CONTEXT, action: 'ngOnInit', message: 'OnReady'}, this.availableApiLinkSelections);
      }),
    ).subscribe();
    this.w.data().objects.onObjectsChange.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      tap(() => {
        this.availableApiLinkSelections = this.castorObjectContext.ObjectLinkContext(this.object);
        if (this.selection?.id) {
          this.onSelect([...this.availableApiLinkSelections].find((el) => el.id === this.selection.id));
        }
      })
    ).subscribe();
    // Set ispProjectOwner
    this.isProjectOwner = this.w.data()?.projet?.selected?.item?.owner_uuid === this.w.data()?.user?.user_uuid;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.selection = {id: "details", label: 'details', info: null, type: null};
  }

  onSelect(i: LinkSelection) {
    console.log("on select link ", i);
    if (i){
      this.selection = i;
      this.checkLinkNoCreation(i);
      this.fabCreateObject?.close();
    } else {
      LOG.debug.log({...CONTEXT, action: 'onSelect'}, i);
    }

  }

  /**
   * Determines if the "Add New Object" button should be displayed based on the given LinkSelection object.
   *
   * @param {LinkSelection} i - The LinkSelection object containing information about the link.
   */
  checkLinkNoCreation(i: LinkSelection) {
    // Link section fait case
    if (i.link_info && [ApiDbTable.link_section_fait, ApiDbTable.link_section_us, ApiDbTable.link_section_ensemble].includes(i.link_info.ref_table)) {
      this.displayAddNewObjectBtn = ![ApiDbTable.fait, ApiDbTable.us, ApiDbTable.ensemble].includes(i.info.ref_table);
      // Link topos case
    } else if ( i.link_info && [ApiDbTable.link_topo_fait, ApiDbTable.link_topo_us, ApiDbTable.link_topo_ensemble, ApiDbTable.link_topo_section].includes(i.link_info.ref_table)) {
      this.displayAddNewObjectBtn = ![ApiDbTable.fait, ApiDbTable.us, ApiDbTable.ensemble, ApiDbTable.section].includes(i.info.ref_table);
      // Link section doc case
    } else if (i.link_info && [ApiDbTable.link_document_fait, ApiDbTable.link_document_us, ApiDbTable.link_ensemble_document, ApiDbTable.link_document_section, ApiDbTable.link_document_echantillon].includes(i.link_info.ref_table)) {
      this.displayAddNewObjectBtn = ![ApiDbTable.fait, ApiDbTable.us, ApiDbTable.ensemble, ApiDbTable.section, ApiDbTable.echantillon].includes(i.info.ref_table);
      // Link contenant case
    } else if (i.link_info && [ApiDbTable.link_contenant_echantillon].includes(i.link_info.ref_table)) {
      this.displayAddNewObjectBtn = false;
    } else {
      this.displayAddNewObjectBtn = true;
    }
  }

  async onClickAddNewObject() {
    if (this.selection.id && this.selection.info.obj_table) {
      //TODO: May be better, delete switch ?
      let sectorUuid: string = null;
      let usUuid: string = null;
      let data: OverlayEventDetailData;
      switch (this.selection.info.obj_table) {
        case ApiDbTable.contenant:
          data = await this.modalService.openObjectCreationLinkModal(this.object, this.selection);
            if (data?.objectUuid && this.selection.type === 'link') {
              return createNewLinkInDb('contenant_uuid', data?.objectUuid, this.object, this.selection,
                    this.w.data().projet.selected.item.projet_uuid, this.w.data().user.user_uuid, data?.customField);
            } else {
              return throwError(() => new Error('An error occurred'))
            }
        case ApiDbTable.document_photo:
        case ApiDbTable.document_minute:
          if (this.selection.type === 'link') {
            switch (this.object?.info?.ref_table) {
              case ApiDbTable.us:
                sectorUuid = (this.object.item as ApiUs).secteur_uuid;
                break;
              case ApiDbTable.fait:
                sectorUuid = (this.object.item as ApiFait).secteur_uuid;
                break;
              case ApiDbTable.section:
                sectorUuid = (this.object.item as ApiSection).secteur_uuid;
                break;
              case ApiDbTable.echantillon:
                const mobilierUsUuid: string = (this.object.item as ApiEchantillon).us_uuid;
                sectorUuid = this.w.data().objects.us.all.findByUuid(mobilierUsUuid).item.secteur_uuid;
                break;
              case ApiDbTable.topo:
                sectorUuid = (this.object.item as ApiTopo).secteur_uuid;
            }
          }
          data = await this.modalService.openObjectCreationLinkModal(this.object, this.selection, sectorUuid);
            if (data?.objectUuid && this.selection.type === 'link') {
                  return createNewLinkInDb('document_uuid', data?.objectUuid, this.object, this.selection,
                    this.w.data().projet.selected.item.projet_uuid, this.w.data().user.user_uuid, data?.customField);
            } else {
              return throwError(() => new Error('An error occurred'))
            }
        case ApiDbTable.echantillon_mobilier:
        case ApiDbTable.echantillon_prelevement:
          switch (this.object?.info?.ref_table) {
            case ApiDbTable.us:
              sectorUuid = (this.object.item as ApiUs).secteur_uuid;
              usUuid = (this.object.item as ApiUs).us_uuid;
              break;
            case ApiDbTable.section:
              sectorUuid = (this.object.item as ApiSection).secteur_uuid;
              break;
          }
          data = await this.modalService.openObjectCreationLinkModal(this.object, this.selection, sectorUuid, undefined, usUuid);
          console.log(data);
            if (data?.objectUuid && this.selection.type === 'link') {
                  return createNewLinkInDb('echantillon_uuid', data?.objectUuid, this.object, this.selection,
                    this.w.data().projet.selected.item.projet_uuid, this.w.data().user.user_uuid, data?.customField);
            } else if (this.selection.type === 'direct' && this.object?.info?.ref_table === 'section') {
              const echantillon: dbBoundObject<ApiEchantillon> = this.w.data().objects.echantillon.all.list.find(
                (echantillon) => {
                return echantillon.item.echantillon_uuid === data?.objectUuid;
              });
              console.log(echantillon, this.w.data().objects.echantillon.all.list, data);
              echantillon.item.section_uuid = (this.object.item as ApiSection).section_uuid;
              return this.w.data().objects.echantillon.selected.commit(echantillon.item);
            } else {
              return throwError(() => new Error('An error occurred'));
            }
        case ApiDbTable.ensemble:
          data = await this.modalService.openObjectCreationLinkModal(this.object, this.selection)
            if (data?.objectUuid && this.selection.type === 'link') {
                  return createNewLinkInDb('ensemble_uuid', data?.objectUuid, this.object, this.selection,
                    this.w.data().projet.selected.item.projet_uuid, this.w.data().user.user_uuid, data?.customField);
            } else {
              return throwError(() => new Error('An error occurred'));
            }
        case ApiDbTable.fait:
          // Get the sector ID from Sector
          if (this.selection.type === 'direct' && this.object?.info?.ref_table === ApiDbTable.secteur) {
            sectorUuid = (this.object.item as ApiSecteur).secteur_uuid;
          }
          data = await this.modalService.openObjectCreationLinkModal(this.object, this.selection, sectorUuid)
            if (data?.objectUuid && this.selection.type === 'link') {
                  return createNewLinkInDb('fait_uuid', data?.objectUuid, this.object, this.selection,
                    this.w.data().projet.selected.item.projet_uuid, this.w.data().user.user_uuid, data?.customField);
            } else {
              return throwError(() => new Error('An error occurred'))
            }
        case ApiDbTable.section_sondage:
        case ApiDbTable.section_coupe:
          if (this.selection.type === 'link') {
            switch (this.object?.info?.ref_table) {
              case ApiDbTable.us:
                sectorUuid = (this.object.item as ApiUs).secteur_uuid;
                break;
              case ApiDbTable.fait:
                sectorUuid = (this.object.item as ApiFait).secteur_uuid;
                break;
            }
          }
          data = await this.modalService.openObjectCreationLinkModal(this.object, this.selection, sectorUuid)
            if (data?.objectUuid && this.selection.type === 'link') {
                  return createNewLinkInDb('section_uuid', data?.objectUuid, this.object, this.selection,
                    this.w.data().projet.selected.item.projet_uuid, this.w.data().user.user_uuid, data?.customField);
            } else {
              return throwError(() => new Error('An error occurred'))
            }
        case ApiDbTable.topo:
          let faitUuidTopo: string = null;
          if (this.selection.type === 'link') {
            switch (this.object?.info?.ref_table) {
              case ApiDbTable.fait:
                sectorUuid = (this.object.item as ApiFait).secteur_uuid;
                faitUuidTopo = (this.object.item as ApiFait).fait_uuid;
                break;
              case ApiDbTable.section:
                sectorUuid = (this.object.item as ApiSection).secteur_uuid;
                break;
              case ApiDbTable.echantillon:
                const mobilierUsUuid: string = (this.object.item as ApiEchantillon).us_uuid;
                sectorUuid = this.w.data().objects.us.all.findByUuid(mobilierUsUuid).item.secteur_uuid;
                break;
              case ApiDbTable.us:
                sectorUuid = (this.object.item as ApiUs).secteur_uuid;
                break;
            }
          }
          data = await this.modalService.openObjectCreationLinkModal(this.object, this.selection, sectorUuid, faitUuidTopo)
            if (data?.objectUuid && this.selection.type === 'link') {
                  return createNewLinkInDb('topo_uuid', data?.objectUuid, this.object, this.selection,
                    this.w.data().projet.selected.item.projet_uuid, this.w.data().user.user_uuid, data?.customField);
            } else {
              return throwError(() => new Error('An error occurred'))
            }
        case ApiDbTable.us:
          // Send fait sector uuid and fait uuid for new us form
          let sectorUuidUs: string = null;
          let faitUuid: string = null;
          if (this.selection.type === 'direct' && this.object?.info?.ref_table === 'fait') {
            const fait = this.object.item as ApiFait;
            sectorUuidUs = fait.secteur_uuid;
            faitUuid = fait.fait_uuid;
          } else if (this.selection.type === 'direct' && this.object?.info?.ref_table === ApiDbTable.secteur) {
            sectorUuidUs = (this.object.item as ApiSecteur).secteur_uuid;
          }
          data = await this.modalService.openObjectCreationLinkModal(this.object, this.selection, sectorUuidUs, faitUuid);
          if (data?.objectUuid) {
            if (this.selection.type === 'link') {
                return createNewLinkInDb('us_uuid', data?.objectUuid, this.object, this.selection,
                  this.w.data().projet.selected.item.projet_uuid, this.w.data().user.user_uuid, data?.customField);
              // CASE Link US created to FAIT
            } else if (this.selection.type === 'direct' && this.object?.info?.ref_table === 'fait') {
                const us = this.w.data().objects.us.all.list.find((us) => us.item.us_uuid === data?.objectUuid).item;
                const fait = this.object.item as ApiFait;
                us.fait_uuid = fait?.fait_uuid;
                return this.w.data().objects.us.selected.commit(us);
            } else {
              return throwError(() => new Error('An error occurred'));
            }
          } else {
            return throwError(() => new Error('An error occurred'));
          }
        default:
          return throwError(() => new Error('An error occurred - not a known case'));
      }
    } else {
      return throwError(() => new Error('missing selection data'));
    }
  }

  async openLinkModal() {
    const modal = await this.modalCtrl.create({
      component: LinkEditingModalComponent,
      componentProps: {
        reference: this.object,
        target: this.w.data().context.linkSelection
      }
    });
    modal.present();

    const {data, role} = await modal.onWillDismiss();
  }

  displayCreateFab(): boolean {
    return [ApiDbTable.contenant,
      ApiDbTable.document_photo,
      ApiDbTable.ensemble,
      ApiDbTable.fait,
      ApiDbTable.secteur,
      ApiDbTable.section_sondage,
      ApiDbTable.echantillon_mobilier,
      ApiDbTable.echantillon_prelevement,
      ApiDbTable.section_coupe,
      ApiDbTable.topo,
      ApiDbTable.us,
      ApiDbTable.document_minute].includes(this.selection.id as ApiDbTable);
  }

}

