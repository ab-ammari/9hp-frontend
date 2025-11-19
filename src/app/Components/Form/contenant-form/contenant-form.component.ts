import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ApiContenant, ApiEchantillon, ApiSynchroFrontInterfaceEnum, ApiTypeCategory} from "../../../../../shared";
import {map, tap} from "rxjs/operators";
import {A} from "../../../Core-event";
import {WorkerService} from "../../../services/worker.service";
import {Observable, of, Subscription} from "rxjs";
import {SelectionHook} from "../../../DataClasses/models/castor-abstract-object-data-class";
import {v4} from "uuid";
import {LOG} from "ngx-wcore";

@Component({
  selector: 'app-contenant-form',
  templateUrl: './contenant-form.component.html',
  styleUrls: ['./contenant-form.component.scss']
})
export class ContenantFormComponent implements OnInit, OnDestroy {



  @Input() contenant: ApiContenant;

  @Input() unSavedForm: boolean;


  readonly hook: SelectionHook<ApiContenant> = {
    id: v4(),
    callback: change => {
      return this.validContenant().pipe(
        map(result => change),
        tap(value => {
          LOG.debug.log('VALID FAIT', value);
        })
      );
    }
  };


  ApiTypeCategory = ApiTypeCategory;

  constructor(private w: WorkerService) { }

  ngOnInit(): void {
    this.w.data().objects.contenant.addHook(this.hook);

  }
  ngOnDestroy() {
    this.w.data().objects.contenant.removeHook(this.hook);

    this.validContenant().subscribe();
  }

  onChangeForm() {
    if (this.unSavedForm) {
      return;
    } else {
      this.unSavedForm = true;

    }
  }

  validContenant() {
    console.log("Contenant update :: ", this.contenant);
    if (this.unSavedForm) {
      this.unSavedForm = false;

      return this.w.data().objects.contenant.selected.commit(this.contenant);
    } else {
      return of(undefined);
    }

  }

}
