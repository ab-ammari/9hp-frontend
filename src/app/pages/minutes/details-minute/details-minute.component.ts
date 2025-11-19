import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {
  InfoToDisplayItemHeadband
} from "../../../Components/Display/headband-item-header/headband-item-header.component";

import {Observable, of, Subject} from "rxjs";
import {showUnSaveDialog} from "../../../util/utils";
import {ConfirmationService} from "../../../services/confirmation.service";
import {CastorUtilitiesService} from "../../../services/castor-utilities.service";
import {getMinuteColors} from "../../../util/castor-object-color-schemes";
import {ApiDocumentMinute} from "../../../../../shared";

@Component({
  selector: 'app-details-minute',
  templateUrl: './details-minute.component.html',
  styleUrls: ['./details-minute.component.scss']
})
export class DetailsMinuteComponent implements OnInit,  OnDestroy {

  protected readonly getMinuteColors = getMinuteColors;

  public saveSubject: Subject<void> = new Subject<void>();

  headBandHeaderInfo: InfoToDisplayItemHeadband;
  unSaveChange: boolean;

  get selectedMinute(): ApiDocumentMinute {
    return this.w.data().objects.document.selected.item as ApiDocumentMinute;
  }

  constructor(public w: WorkerService, private confirmationService: ConfirmationService, public utiles: CastorUtilitiesService) { }

  ngOnInit(): void {
    const faitTag = this.utiles.getAllMinuteLinkedFaits(this.w.data().objects?.document?.selected?.item?.document_uuid)
      ?.map(item => item.item.tag)?.join(', ');
    this.headBandHeaderInfo = {
      title: [{key: faitTag, keyType: 'custString'}]
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
