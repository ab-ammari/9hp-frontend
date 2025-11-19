import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ApiDocument, ApiDocumentPhoto, ApiSynchroFrontInterfaceEnum, ApiTypeCategory} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {map, tap} from "rxjs/operators";
import {A} from "../../../Core-event";
import {Observable, of, Subscription} from "rxjs";
import {SelectionHook} from "../../../DataClasses/models/castor-abstract-object-data-class";
import {v4} from "uuid";
import {LOG} from "ngx-wcore";

@Component({
  selector: 'app-photo-form',
  templateUrl: './photo-form.component.html',
  styleUrls: ['./photo-form.component.scss']
})
export class PhotoFormComponent implements OnInit, OnDestroy {



  @Input() document: ApiDocument;

  @Input() unSavedForm: boolean;

  readonly hook: SelectionHook<ApiDocument> = {
    id: v4(),
    callback: change => {
      return this.validPhoto().pipe(
        map(result => change),
        tap(value => {
          LOG.debug.log('VALID FAIT', value);
        })
      );
    }
  };


  ApiTypeCategory = ApiTypeCategory;
  get photo(): ApiDocumentPhoto {
    return this.document as ApiDocumentPhoto;
  }

  constructor(private w: WorkerService) { }

  ngOnInit(): void {
    this.w.data().objects.document.addHook(this.hook);

  }
  ngOnDestroy() {
    this.w.data().objects.document.removeHook(this.hook);

    this.validPhoto().subscribe();
  }

  onChangeForm() {
    if (this.unSavedForm) {
      return;
    } else {
      this.unSavedForm = true;

    }
  }

  validPhoto() {
    console.log("photo update :: ", this.photo);
    if (this.unSavedForm) {
      this.unSavedForm = false;

      return this.w.data().objects.document.selected.commit(this.photo);
    } else {
      return of(undefined);
    }

  }

}
