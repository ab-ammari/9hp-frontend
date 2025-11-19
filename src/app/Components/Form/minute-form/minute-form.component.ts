import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
  ApiContenant,
  ApiDocument,
  ApiDocumentMinute,
  ApiSynchroFrontInterfaceEnum,
  ApiTypeCategory
} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {map, tap} from "rxjs/operators";
import {A} from "../../../Core-event";
import {Observable, of, Subscription} from "rxjs";
import {SelectionHook} from "../../../DataClasses/models/castor-abstract-object-data-class";
import {v4} from "uuid";
import {LOG} from "ngx-wcore";

@Component({
  selector: 'app-minute-form',
  templateUrl: './minute-form.component.html',
  styleUrls: ['./minute-form.component.scss']
})
export class MinuteFormComponent implements OnInit, OnDestroy {



  @Input() document: ApiDocument;

  @Input() unSavedForm: boolean;


  readonly hook: SelectionHook<ApiDocument> = {
    id: v4(),
    callback: change => {
      return this.validMinute().pipe(
        map(result => change),
        tap(value => {
          LOG.debug.log('VALID FAIT', value);
        })
      );
    }
  };

  ApiTypeCategory = ApiTypeCategory;
  get minute(): ApiDocumentMinute{
    return this.document as ApiDocumentMinute;
  }

  constructor(private w: WorkerService) { }

  ngOnInit(): void {
    this.w.data().objects.document.addHook(this.hook);

  }
  ngOnDestroy(){
    this.w.data().objects.document.removeHook(this.hook);

    this.validMinute().subscribe();
  }

  onChangeForm() {
    if (this.unSavedForm) {
      return;
    } else {
      this.unSavedForm = true;

    }
  }

  validMinute() {
    console.log("minute update :: ", this.minute);
    if (this.unSavedForm) {
      this.unSavedForm = false;

      return this.w.data().objects.document.selected.commit(this.minute);
    } else {
      return of(undefined);
    }

  }

}
