import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {
  InfoToDisplayItemHeadband
} from "../../../Components/Display/headband-item-header/headband-item-header.component";
import {ConfirmationService} from "../../../services/confirmation.service";

import {Observable, of, Subject} from "rxjs";
import {showUnSaveDialog} from "../../../util/utils";
import {getEnsembleColors} from "../../../util/castor-object-color-schemes";
import {CastorUtilitiesService} from "../../../services/castor-utilities.service";

@Component({
  selector: 'app-details-ensemble',
  templateUrl: './details-ensemble.component.html',
  styleUrls: ['./details-ensemble.component.scss']
})
export class DetailsEnsembleComponent implements OnInit,  OnDestroy {

  headBandHeaderInfo: InfoToDisplayItemHeadband;
  unSaveChange: boolean;

  public saveSubject: Subject<void> = new Subject<void>();

  protected readonly getEnsembleColors = getEnsembleColors;

  constructor(public w: WorkerService,
              private confirmationService: ConfirmationService,
              public utils: CastorUtilitiesService) { }

  ngOnInit(): void {
    this.headBandHeaderInfo = {
      title: [{key: 'ensemble_identification_uuid', keyType: 'type'}]
    };
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

  ngOnDestroy(): void {
    this.saveSubject.complete();
  }

}
