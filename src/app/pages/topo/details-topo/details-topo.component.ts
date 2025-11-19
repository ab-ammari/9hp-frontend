import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {
  InfoToDisplayItemHeadband
} from "../../../Components/Display/headband-item-header/headband-item-header.component";

import {Observable, of, Subject} from "rxjs";
import {showUnSaveDialog} from "../../../util/utils";
import {ConfirmationService} from "../../../services/confirmation.service";
import {getTopoColors} from "../../../util/castor-object-color-schemes";

@Component({
  selector: 'app-details-topo',
  templateUrl: './details-topo.component.html',
  styleUrls: ['./details-topo.component.scss']
})
export class DetailsTopoComponent implements OnInit,  OnDestroy {

  public saveSubject: Subject<void> = new Subject<void>();

  headBandHeaderInfo: InfoToDisplayItemHeadband;
  unSaveChange: boolean;

  constructor(public w: WorkerService, private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.headBandHeaderInfo = {
      title: [{key: 'topo_type_uuid', keyType: 'type'}]
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

    protected readonly getTopoColors = getTopoColors;

  ngOnDestroy(): void {
    this.saveSubject.complete();
  }
}
