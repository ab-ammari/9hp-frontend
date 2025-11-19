import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {
  InfoToDisplayItemHeadband
} from "../../../Components/Display/headband-item-header/headband-item-header.component";
import {ConfirmationService} from "../../../services/confirmation.service";

import {Observable, of, Subject} from "rxjs";
import {showUnSaveDialog} from "../../../util/utils";

@Component({
  selector: 'app-details-sondage',
  templateUrl: './details-sondage.component.html',
  styleUrls: ['./details-sondage.component.scss']
})
export class DetailsSondageComponent implements OnInit,  OnDestroy {

  public saveSubject: Subject<void> = new Subject<void>();

  headBandHeaderInfo: InfoToDisplayItemHeadband;
  unSaveChange: boolean;

  constructor(public w: WorkerService, private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.headBandHeaderInfo = {
      title: [{key: 'section_type', keyType: 'type'}]
    };
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

  ngOnDestroy(): void {
    this.saveSubject.complete();
  }

}
