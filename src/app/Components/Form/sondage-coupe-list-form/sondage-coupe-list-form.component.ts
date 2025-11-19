import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ApiDbTable, ApiSectionCoupe, ApiSectionSondage} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {takeUntil, tap} from "rxjs/operators";
import {IonModal, IonPopover} from "@ionic/angular";
import { DB } from 'src/app/Database/DB';
import {Subject} from "rxjs";
import {LOG, LoggerContext} from "ngx-wcore";


const CONTECT: LoggerContext = {
  origin: 'SondageCoupeListFormComponent'
}
@Component({
  selector: 'app-sondage-coupe-list-form',
  templateUrl: './sondage-coupe-list-form.component.html',
  styleUrls: ['./sondage-coupe-list-form.component.scss']
})
export class SondageCoupeListFormComponent implements OnInit, OnDestroy {

  constructor(private w: WorkerService) {
  }

  @ViewChild('newCoupeModal') newCoupeModal: IonModal;
  @ViewChild('popover') popover: IonPopover;
  @Input() section: ApiSectionSondage;

  arrayCoupeAvailable: Array<dbBoundObject<ApiSectionCoupe>> = [];
  linkedCoupeArray: Array<dbBoundObject<ApiSectionCoupe>> = [];

  selectedCoup: dbBoundObject<ApiSectionCoupe>;

  private $subscriber = new Subject();

  ngOnInit(): void {
    this.initForm();
    DB.database.on_change.pipe(takeUntil(this.$subscriber), tap(() => {
      this.initForm();
    })).subscribe();
  }

  initForm() {
    /* Get all section coupe */
    const arraySectionCoupe = this.w.data().objects.section.all?.list
      ?.filter(section => section.info.obj_table === ApiDbTable.section_coupe) as Array<dbBoundObject<ApiSectionCoupe>>;
    /* Coupe available */
    if (arraySectionCoupe?.length > 0) {
      this.arrayCoupeAvailable = arraySectionCoupe.filter(object => !object.item.section_sondage_uuid);
    }
    /* Filter linked coupe for this sondage */
    if (arraySectionCoupe?.length > 0) {
      this.linkedCoupeArray = arraySectionCoupe.filter(object => object.item.section_sondage_uuid === this.section.section_uuid);
    }
  }

  openNewCoupeModal() {
    this.newCoupeModal?.present();
  }

  closeNewCoupeModal() {
    this.newCoupeModal?.dismiss();
  }

  linkCreatedCoupe(coupeUuid: string) {
    setTimeout(() => {
      if (coupeUuid) {
        const coupe: dbBoundObject<ApiSectionCoupe> = this.w.data().objects.section.all.findByUuid(coupeUuid) as dbBoundObject<ApiSectionCoupe>;
        if (coupe?.item?.section_uuid) {
          this.selectedCoup = coupe;
          this.linkCoup();
        } else {
          LOG.warn.log({...CONTECT, action: '', message: 'Counl\'t find object to link for some reason'}, coupe, coupeUuid);
        }
      }
    }, 2000);
  }

  linkCoup() {
    if (this.selectedCoup) {
      const coupUpdated: ApiSectionCoupe = {
        ...this.selectedCoup.item,
        section_sondage_uuid: this.section.section_uuid
      };
      this.selectedCoup.commit(coupUpdated).pipe(tap(() => {
        this.popover?.dismiss();
        this.newCoupeModal.dismiss();
      })).subscribe();
    }
  }

  deleteCoup(coupe: dbBoundObject<ApiSectionCoupe>) {
    const coupeUpdated: ApiSectionCoupe = {
      ...coupe.item,
      section_sondage_uuid: null
    };
    coupe.commit(coupeUpdated).pipe(tap(() => {
    })).subscribe();
  }

  ngOnDestroy(): void {
    this.$subscriber.next(undefined);
  }
}
