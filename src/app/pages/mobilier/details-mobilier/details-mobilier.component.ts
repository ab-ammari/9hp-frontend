import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {
  InfoToDisplayItemHeadband
} from "../../../Components/Display/headband-item-header/headband-item-header.component";

import {Observable, of, Subject} from "rxjs";
import {showUnSaveDialog} from "../../../util/utils";
import {ConfirmationService} from "../../../services/confirmation.service";
import {getMobilierColors} from "../../../util/castor-object-color-schemes";
import {ApiEchantillonMobilier} from "../../../../../shared";

@Component({
  selector: 'app-details-mobilier',
  templateUrl: './details-mobilier.component.html',
  styleUrls: ['./details-mobilier.component.scss']
})
export class DetailsMobilierComponent implements OnInit,  OnDestroy {

  protected readonly getMobilierColors = getMobilierColors;

  public saveSubject: Subject<void> = new Subject<void>();

  headBandHeaderInfo: InfoToDisplayItemHeadband;
  unSaveChange: boolean;

  get selectedMobilier(): ApiEchantillonMobilier {
    return this.w.data().objects?.echantillon?.selected?.item as ApiEchantillonMobilier;
  }

  constructor(public w: WorkerService, private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.headBandHeaderInfo = {
      title: [{key: 'mobilier_identification_uuid', keyType: 'type'}]
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

  ngOnDestroy(): void {
    this.saveSubject.complete();
  }

}
