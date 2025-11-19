import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {
  InfoToDisplayItemHeadband
} from "../../../Components/Display/headband-item-header/headband-item-header.component";

import {Observable, of, Subject} from "rxjs";
import { showUnSaveDialog } from 'src/app/util/utils';
import {ConfirmationService} from "../../../services/confirmation.service";
import {getPrelevementColors} from "../../../util/castor-object-color-schemes";
import {ApiEchantillonPrelevement} from "../../../../../shared";
import {Api} from "aws-sdk/clients/apigatewayv2";

@Component({
  selector: 'app-details-prelevement',
  templateUrl: './details-prelevement.component.html',
  styleUrls: ['./details-prelevement.component.scss']
})
export class DetailsPrelevementComponent implements OnInit,  OnDestroy {

  protected readonly getPrelevementColors = getPrelevementColors;

  public saveSubject: Subject<void> = new Subject<void>();

  headBandHeaderInfo: InfoToDisplayItemHeadband;
  unSaveChange: boolean;

  get selectedPrelevement(): ApiEchantillonPrelevement {
    return this.w.data().objects.echantillon.selected.item as ApiEchantillonPrelevement;
  }

  constructor(public w: WorkerService, private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.headBandHeaderInfo = {
      title: [{key: 'type_nature_uuid', keyType: 'type'}]
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

  ngOnDestroy(): void {
    this.saveSubject.complete();
  }

}
