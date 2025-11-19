import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {
  ApiDbTable,
  ApiEchantillon,
  ApiEchantillonPrelevement,
  ApiFait, ApiSection,
  ApiSynchroFrontInterfaceEnum,
  ApiTypeCategory,
  ApiUs
} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {map, tap} from "rxjs/operators";
import {A} from "../../../Core-event";
import {Observable, of, Subscription} from "rxjs";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {LOG} from "ngx-wcore";
import {SelectionHook} from "../../../DataClasses/models/castor-abstract-object-data-class";
import {v4} from "uuid";

@Component({
  selector: 'app-prelevement-form',
  templateUrl: './prelevement-form.component.html',
  styleUrls: ['./prelevement-form.component.scss']
})
export class PrelevementFormComponent implements OnInit, OnChanges, OnDestroy {



  @Input() echantillon: ApiEchantillon;

  @Input() unSavedForm: boolean;

  readonly hook: SelectionHook<ApiEchantillon> = {
    id: v4(),
    callback: change => {
      return this.validPrelevement().pipe(
        map(result => change),
        tap(value => {
          LOG.debug.log('VALID FAIT', value);
        })
      );
    }
  };


  get prelevement(): ApiEchantillonPrelevement {
    return this.echantillon as ApiEchantillonPrelevement;
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

  ngOnDestroy(){
    this.w.data().objects.echantillon.removeHook(this.hook);

    this.validPrelevement().subscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['echantillon']) {
      this.init();
    }
  }

  init() {
    if (this.echantillon) {
      if (this.echantillon.us_uuid) {
        this.us = this.w.data().objects.us.all.findByUuid(this.echantillon.us_uuid);

        if (this.us?.item.fait_uuid) {
          this.fait = this.w.data().objects.fait.all.findByUuid(this.us?.item.fait_uuid);

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
    if (this.echantillon){
      this.echantillon.us_uuid = this.us?.uuid;
      this.echantillon.section_uuid = this.sondage?.uuid;
    }
    if (this.unSavedForm) {
      return;
    } else {
      this.unSavedForm = true;

    }
  }

  validPrelevement() {
    console.log("prelevement update :: ", this.prelevement);
    if (this.unSavedForm) {
      this.unSavedForm = false;
      return this.w.data().objects.echantillon.selected.commit(this.prelevement);
    } else {
      return of(undefined);
    }

  }

}
