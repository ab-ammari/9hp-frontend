import {Component, Input, OnInit} from '@angular/core';
import {ModalController} from "@ionic/angular";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {ApiDbTable, ApiSyncableObject} from "../../../../../shared";
import {LinkSelection} from "../../../services/castor-object-context.service";
import {LOG, LoggerContext} from "ngx-wcore";
import {createNewLinkInDb, isLinkFaitSectionRelation, isLinkMinuteRelation} from "../../../util/utils";
import {WorkerService} from "../../../services/worker.service";
import {DB} from "../../../Database/DB";
import {debounce, takeUntil, tap} from "rxjs/operators";
import {Subject, timer} from "rxjs";

const CONTEXT: LoggerContext = {
  origin: 'LinkEditingModalComponent'
}

@Component({
  selector: 'app-link-editing-modal',
  templateUrl: './link-editing-modal.component.html',
  styleUrls: ['./link-editing-modal.component.scss']
})
export class LinkEditingModalComponent implements OnInit {

  @Input() reference: dbBoundObject<ApiSyncableObject>;
  @Input() target: LinkSelection;
  @Input() link: dbBoundObject<ApiSyncableObject>
  @Input() link_target: dbBoundObject<ApiSyncableObject>

  selectedTarget: dbBoundObject<ApiSyncableObject>;
  available_target_list: Array<dbBoundObject<ApiSyncableObject>>;

  note: string; // Relation note
  $subscriber: Subject<null> = new Subject<null>();

  constructor(public w: WorkerService, private modalCtrl: ModalController) {
  }

  ngOnInit(): void {
    LOG.debug.log({
      ...CONTEXT,
      action: 'ngOnInit'
    }, this.target, this.link_target);
    this.init();
    DB.database.on_change.pipe(
      takeUntil(this.$subscriber),
      debounce(() => timer(5000)),
      tap(() => this.init())
    ).subscribe();
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    return this.modalCtrl.dismiss(true, 'confirm');
  }


  init() {
    const ref_uuid = this.reference.info.uuid_paths[0];

    if (this.target) {
      const target_uuid = this.target.info.uuid_paths[0];

      LOG.debug.log({
        ...CONTEXT,
        action: 'available_target_list'
      }, this.target.info, this.w.data().objects[this.target.info.ref_table].all.list);

      switch (this.target.info.obj_table) {
        case ApiDbTable.section_sondage:
        case ApiDbTable.section_coupe:
        case ApiDbTable.echantillon_mobilier:
        case ApiDbTable.echantillon_prelevement:
        case ApiDbTable.document_photo:
        case ApiDbTable.document_minute:
          this.available_target_list = this.getAvailableTargetChildList(ref_uuid, target_uuid, this.target.info.obj_table);
          break;
        default:
          this.available_target_list = this.getAvailableTargetList(ref_uuid, target_uuid);
          break;
      }
      // Reset selected target
      this.selectedTarget = null;
    }

    if (this.link && this.link_target) {
      //set already selected target
      LOG.debug.log({
        ...CONTEXT,
        action: 'find already selected target object'
      }, this.link.item, this.link_target);
      this.selectedTarget = this.link_target;
      this.available_target_list = [this.selectedTarget];
      this.note = this.link.item['note'];
    }
    const isDocument = (this.target.info.ref_table === ApiDbTable.document || this.reference.info.ref_table === ApiDbTable.document);
    if (!isDocument && this.reference && 'secteur_uuid' in this.reference?.item && this.reference.item['secteur_uuid'] !== null) {
      this.available_target_list = this.available_target_list.filter((t) => {
        if (t.item && 'secteur_uuid' in t.item && t.item['secteur_uuid'] != null) {
          return t.item['secteur_uuid'] === this.reference.item['secteur_uuid'];
        } else {
          return true;
        }
      });
    }
  }

  getAvailableTargetList(ref_uuid: string, target_uuid: string): Array<dbBoundObject<ApiSyncableObject>> {
    return this.w.data().objects[this.target.info.ref_table].all.list?.filter(
      (item: dbBoundObject<ApiSyncableObject>) => {
        //  LOG.debug.log({...CONTEXT, action: 'checking item'}, item);
        const isUS = (item.info.ref_table === ApiDbTable.us);
        const target_table = isUS ? item.info.ref_table : item.info.obj_table;
        const item_table = isUS ? item.info.ref_table : item.info.obj_table;

        return item_table === target_table &&
          !this.target.links?.list?.some(link => {
            const alreadyExists = (link.item[ref_uuid] === this.reference.item[ref_uuid]) &&
              (link.item[target_uuid] === item.item[target_uuid]);
            return alreadyExists;
          })
      });
  }

  getAvailableTargetChildList(ref_uuid: string, target_uuid: string, table: ApiDbTable): Array<dbBoundObject<ApiSyncableObject>> {

    return this.w.data().objects[this.target.info.ref_table].all?.childList(table)?.filter(
      (item: dbBoundObject<ApiSyncableObject>) => {
        // LOG.debug.log({...CONTEXT, action: 'checking childlist item'}, item);
        const isUS = (item.info.ref_table === ApiDbTable.us);
        const target_table = isUS ? item.info.ref_table : item.info.obj_table;
        const item_table = isUS ? item.info.ref_table : item.info.obj_table;

        return item_table === target_table &&
          !this.target.links?.list.some(link => {
            const alreadyExists = (link.item[ref_uuid] === this.reference.item[ref_uuid]) &&
              (link.item[target_uuid] === item.item[target_uuid]);

            return alreadyExists;
          })
      });
  }

  createNewLinkWith(target: dbBoundObject<ApiSyncableObject>) {
    LOG.debug.log({
      ...CONTEXT,
      action: 'createNewLinkWith',
      message: 'creating new LINK object'
    }, target, this.reference.item);
    const relationField: { note: string } = {note: this.note ?? ''};
    this.addNewLinkInDb(target, relationField);
    this.note = '';
    this.confirm();
  }

  isCustomRelation(): boolean {
    return (this.isMinuteRelation() || this.isFaitSectionRelation());
  }

  isMinuteRelation(): boolean {
    if (this.link_target?.info.obj_table === ApiDbTable.document_minute) {
      // LOG.debug.log({...CONTEXT, action: 'isMinuteRelation'}, this.link_target, this.reference);
      return true;
    }
    return isLinkMinuteRelation(this.reference, this.target);
  }

  isFaitSectionRelation(): boolean {
    const fait_section = [ApiDbTable.fait, ApiDbTable.section_sondage];
    if (fait_section.includes(this.link_target?.info.obj_table) && fait_section.includes(this.reference?.info.obj_table)) {
      // LOG.debug.log({...CONTEXT, action: 'isFaitSectionRelation'}, this.link_target, this.reference);
      return true;
    }
    return isLinkFaitSectionRelation(this.reference, this.target);
  }

  handleCreateCustomLink(target: dbBoundObject<ApiSyncableObject>,
                         customField: {}) {
    this.addNewLinkInDb(target, customField);
    this.confirm();
  }

  addNewLinkInDb(target: dbBoundObject<ApiSyncableObject>, customField?: {}) {
    createNewLinkInDb(target.info.uuid_paths[0], target.item[target.info.uuid_paths[0]], this.reference, this.target,
      this.w.data().projet.selected.item.projet_uuid, this.w.data().user.user_uuid, customField);
  }
}
