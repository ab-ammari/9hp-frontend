import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {
  InfoToDisplayItemHeadband
} from "../../../Components/Display/headband-item-header/headband-item-header.component";

import {Observable, Observer, of, Subject} from "rxjs";
import {showUnSaveDialog} from "../../../util/utils";
import {ConfirmationService} from "../../../services/confirmation.service";
import {getContenantColors} from "../../../util/castor-object-color-schemes";
import {CastorUtilitiesService} from "../../../services/castor-utilities.service";

@Component({
  selector: 'app-details-contenant',
  templateUrl: './details-contenant.component.html',
  styleUrls: ['./details-contenant.component.scss']
})
export class DetailsContenantComponent implements OnInit,  OnDestroy {

  public saveSubject: Subject<void> = new Subject<void>();

  headBandHeaderInfo: InfoToDisplayItemHeadband;
  unSaveChange: boolean;

  constructor(public w: WorkerService, private confirmationService: ConfirmationService,
              public utils: CastorUtilitiesService) { }

  ngOnInit(): void {
    this.headBandHeaderInfo = {
      title: [{
        key: 'type_contenant_uuid',
        keyType: 'type'
      }]
    };
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.unSaveChange) {
      this.saveSubject.next(undefined);
      return of(true);
    } else {
      return of(true);
    }
  }

  ngOnDestroy() {
    this.saveSubject.complete();
  }

  protected readonly getContenantColors = getContenantColors;
}
