import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {
  InfoToDisplayItemHeadband
} from "../../../Components/Display/headband-item-header/headband-item-header.component";

import {Observable, of, Subject} from "rxjs";
import {ConfirmationService} from "../../../services/confirmation.service";
import {showUnSaveDialog} from "../../../util/utils";
import {getUSColors} from "../../../util/castor-object-color-schemes";

@Component({
  selector: 'app-details-us',
  templateUrl: './details-us.component.html',
  styleUrls: ['./details-us.component.scss']
})
export class DetailsUsComponent implements OnInit,  OnDestroy {

  public saveSubject: Subject<void> = new Subject<void>();

  headBandHeaderInfo: InfoToDisplayItemHeadband;
  unSaveChange: boolean = false;

  constructor(public w: WorkerService, private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.headBandHeaderInfo = {
      title: [{key: 'us_identification_uuid', keyType: 'type'}]
    }
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.unSaveChange) {
      this.saveSubject.next(undefined);
      return of(true);
      // return showUnSaveDialog(this.confirmationService);
    } else {
      return of(true);
    }
  }

    protected readonly getUSColors = getUSColors;

  ngOnDestroy(): void {
    this.saveSubject.complete();
  }
}
