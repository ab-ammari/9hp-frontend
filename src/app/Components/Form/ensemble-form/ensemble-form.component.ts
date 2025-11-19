import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ApiEnsemble, ApiFait, ApiSynchroFrontInterfaceEnum, ApiTypeCategory} from "../../../../../shared";
import {LOG, LoggerContext} from "ngx-wcore";
import {WorkerService} from "../../../services/worker.service";
import {map, tap} from "rxjs/operators";
import {A} from "../../../Core-event";
import {Location} from "@angular/common";
import {Observable, of, Subscription} from "rxjs";
import {SelectionHook} from "../../../DataClasses/models/castor-abstract-object-data-class";
import {v4} from "uuid";

const CONTEXT: LoggerContext = {
  origin: 'EnsembleFormComponent'
}

@Component({
  selector: 'app-ensemble-form',
  templateUrl: './ensemble-form.component.html',
  styleUrls: ['./ensemble-form.component.scss']
})
export class EnsembleFormComponent implements OnInit, OnDestroy {



  @Input() ensemble: ApiEnsemble;

  @Input() unSavedForm: boolean;




  ApiTypeCategory = ApiTypeCategory;

  width: number;
  readonly hook: SelectionHook<ApiEnsemble> = {
    id: v4(),
    callback: change => {
      return this.validEnsemble().pipe(
        map(result => change),
        tap(value => {
          LOG.debug.log('VALID FAIT', value);
        })
      );
    }
  };
  constructor(private w: WorkerService, private location: Location) { }

  ngOnInit(): void {
    this.w.data().objects.ensemble.addHook(this.hook);

  }
  ngOnDestroy() {
    LOG.debug.log({...CONTEXT, action: 'ngOnDestroy'});
    this.w.data().objects.ensemble.removeHook(this.hook);
    this.validEnsemble().subscribe();
  }

  onChangeForm() {
    if (this.unSavedForm) {
      return;
    } else {
      this.unSavedForm = true;
    }
  }

  validEnsemble() {
    LOG.info.log({...CONTEXT, action: 'validEnsemble'}, 'ensemble :: ', this.ensemble);
    if (this.unSavedForm) {
      this.unSavedForm = false;

      return this.w.data().objects.ensemble.selected.commit(this.ensemble);
    } else {
      return of(undefined);
    }

  }

  onBack() {
    this.location.back();
  }

}
