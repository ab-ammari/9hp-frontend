import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {
  InfoToDisplayItemHeadband
} from "../../../Components/Display/headband-item-header/headband-item-header.component";

import {Observable, of, Subject} from "rxjs";
import {showUnSaveDialog} from "../../../util/utils";
import {ConfirmationService} from "../../../services/confirmation.service";
import {getPhotoColors} from "../../../util/castor-object-color-schemes";
import {ApiDocumentPhoto} from "../../../../../shared";

@Component({
  selector: 'app-details-photo',
  templateUrl: './details-photo.component.html',
  styleUrls: ['./details-photo.component.scss']
})
export class DetailsPhotoComponent implements OnInit,  OnDestroy {

  public saveSubject: Subject<void> = new Subject<void>();

  headBandHeaderInfo: InfoToDisplayItemHeadband;
  unSaveChange: boolean;

  get docPhoto(): ApiDocumentPhoto {
    return this.w.data().objects?.document?.selected?.item as ApiDocumentPhoto;
  }

  constructor(public w: WorkerService, private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    // TOOD: Display all link
    this.headBandHeaderInfo = {
      title: [{key: 'photo_type_uuid', keyType: 'type'}]
    }
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.unSaveChange) {
      // return showUnSaveDialog(this.confirmationService);
      this.saveSubject.next(undefined);
      return of(true);
    } else {
      return of(true);
    }
  }

    protected readonly getPhotoColors = getPhotoColors;

  ngOnDestroy(): void {
    this.saveSubject.complete();
  }
}
