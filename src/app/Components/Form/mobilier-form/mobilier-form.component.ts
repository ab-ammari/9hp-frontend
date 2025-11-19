import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {
  ApiDbTable,
  ApiEchantillon,
  ApiEchantillonMobilier,
  ApiFait,
  ApiSection,
  ApiSectionSondage,
  ApiTypeCategory,
  ApiUs
} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {map, tap} from "rxjs/operators";
import {Observable, of, Subscription} from "rxjs";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {LOG, LoggerContext} from "ngx-wcore";
import {SelectionHook} from "../../../DataClasses/models/castor-abstract-object-data-class";
import {v4} from "uuid";

const CONTEXT: LoggerContext = {
  origin: 'MobilierFormComponent'
}
@Component({
  selector: 'app-mobilier-form',
  templateUrl: './mobilier-form.component.html',
  styleUrls: ['./mobilier-form.component.scss']
})
export class MobilierFormComponent implements OnInit, OnChanges, OnDestroy {



  @Input() echantillon: ApiEchantillon;

  @Input() unSavedForm: boolean;

  readonly hook: SelectionHook<ApiEchantillon> = {
    id: v4(),
    callback: change => {
      return this.validMobilier().pipe(
        map(result => change),
        tap(value => {
          LOG.debug.log('VALID FAIT', value);
        })
      );
    }
  };


  get mobilier(): ApiEchantillonMobilier {
    return this.echantillon as ApiEchantillonMobilier;
  }

  us: dbBoundObject<ApiUs>;
  fait: dbBoundObject<ApiFait>;
  sondage: dbBoundObject<ApiSection>;
  readonly sondage_filter = (section: ApiSection) => {
    return section.table === ApiDbTable.section_sondage &&
      (
        !section.secteur_uuid
        ||  this.us?.item.secteur_uuid &&  section.secteur_uuid === this.us.item.secteur_uuid
        || this.fait?.item.secteur_uuid && section.secteur_uuid === this.fait.item.secteur_uuid
      );
  };
  ApiTypeCategory = ApiTypeCategory;

  constructor(public w: WorkerService) {
  }

  ngOnInit(): void {
    this.w.data().objects.echantillon.addHook(this.hook);

  }

  ngOnDestroy() {
    this.w.data().objects.echantillon.removeHook(this.hook);
    this.validMobilier().subscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['echantillon']) {
      this.init();
    }

  }

  private init() {
    if (this.echantillon) {
      if (this.echantillon.us_uuid) {
        this.us = this.w.data().objects.us.all.findByUuid(this.echantillon.us_uuid);
        LOG.debug.log({...CONTEXT,action: 'get Fait ? '}, this.us?.item.fait_uuid, this.us);
        if (this.us?.item.fait_uuid) {
          this.fait = this.w.data().objects.fait.all.findByUuid(this.us?.item.fait_uuid);
          LOG.debug.log({...CONTEXT,action: 'get Fait ? '}, this.fait?.item.fait_uuid, this.fait);
        } else {
          this.fait = null;
        }
      } else {
        this.us = null;
      }
      if (this.echantillon.section_uuid) {
        this.sondage = this.w.data().objects.section.all.findByUuid(this.echantillon.section_uuid);
      } else {
        this.sondage = null;
      }
    }

  }

  onChangeForm() {

    if (this.echantillon) {
      this.echantillon.us_uuid = this.us?.uuid;
      this.echantillon.section_uuid = this.sondage?.uuid;
    }
    if (this.unSavedForm) {
      return;
    } else {
      this.unSavedForm = true;

    }
  }

  validMobilier() {
    console.log("mobilier update :: ", this.mobilier);
    if (this.unSavedForm) {
      this.unSavedForm = false;

      return this.w.data().objects.echantillon.selected.commit(this.mobilier);
    } else {
      return of(undefined);
    }

  }

}
