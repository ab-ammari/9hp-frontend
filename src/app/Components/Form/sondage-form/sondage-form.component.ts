import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
  ApiDbTable, ApiFait,
  ApiSecteur,
  ApiSection,
  ApiSectionCoupe,
  ApiSectionSondage,
  ApiSynchroFrontInterfaceEnum, ApiTypeCategory
} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {LOG, LoggerContext } from "ngx-wcore";
import {map, tap} from "rxjs/operators";
import {A} from "../../../Core-event";
import {Location} from "@angular/common";
import {Observable, of, Subscription} from "rxjs";
import {SelectionHook} from "../../../DataClasses/models/castor-abstract-object-data-class";
import {v4} from "uuid";

const CONTEXT: LoggerContext = {
  origin: 'SondageFormComponent'
}

@Component({
  selector: 'app-sondage-form',
  templateUrl: './sondage-form.component.html',
  styleUrls: ['./sondage-form.component.scss']
})
export class SondageFormComponent implements OnInit, OnDestroy {



  @Input() section: ApiSection;

  @Input() unSavedForm: boolean;

  readonly hook: SelectionHook<ApiSection> = {
    id: v4(),
    callback: change => {
      return this.validSondage().pipe(
        map(result => change)
      );
    }
  };


  get sectionSondage(): ApiSectionSondage {
    return this.section as ApiSectionSondage;
  }

  get sectionCoupe(): ApiSectionCoupe {
    return this.section as ApiSectionCoupe;
  }

  onChangeForm() {
    if (this.unSavedForm) {
      return;
    } else {
      this.unSavedForm = true;

    }
  }

  ApiDbTable = ApiDbTable;
  // dimensionsString: string;

  secteur: ApiSecteur;
  ApiTypeCategory = ApiTypeCategory;

  constructor(public w: WorkerService, private location: Location) {
  }

  ngOnInit(): void {
    this.w.data().objects.section.addHook(this.hook);
  }
  ngOnDestroy() {
    this.w.data().objects.section.removeHook(this.hook);
    this.validSondage().subscribe();
  }

  validSondage() {
    if (this.unSavedForm) {
      this.unSavedForm = false;
      if (this.section.table === ApiDbTable.section_coupe) {
        LOG.info.log({...CONTEXT, action: 'Update coupe'}, this.sectionCoupe);
        return this.commitObject(this.sectionCoupe);
      } else {
        LOG.info.log({...CONTEXT, action: 'Update sondage'}, this.sectionSondage);
        return this.commitObject(this.sectionSondage);
      }
    } else {
      return of(undefined);
    }

  }

  commitObject(section: ApiSection) {
    if (section.table === ApiDbTable.section_sondage) {
      return this.w.data().objects.section.selected.commit(section as ApiSectionSondage);
    } else if (section.table === ApiDbTable.section_coupe) {
      return this.w.data().objects.section.selected.commit(section as ApiSectionCoupe);
    } else {
      LOG.error.log({...CONTEXT, action: 'commitObject', message: 'WTF !??'}, section);
      return of(undefined);
    }
  }

  onBack() {
    this.location.back();
  }

}
