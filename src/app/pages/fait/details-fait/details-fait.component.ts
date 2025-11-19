import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {
  InfoToDisplayItemHeadband
} from "../../../Components/Display/headband-item-header/headband-item-header.component";
import {ConfirmationService} from "../../../services/confirmation.service";
import {getFaitColors} from "../../../util/castor-object-color-schemes";
import {LOG, LoggerContext} from "ngx-wcore";



const CONTEXT: LoggerContext = {
  origin: 'DetailsFaitComponent'
}

@Component({
  selector: 'app-details-fait',
  templateUrl: './details-fait.component.html',
  styleUrls: ['./details-fait.component.scss']
})
export class DetailsFaitComponent implements OnInit, OnDestroy {


  headBandHeaderInfo: InfoToDisplayItemHeadband;

  constructor(public w: WorkerService, private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.headBandHeaderInfo = {
      title: [{key: 'fait_identification_uuid', keyType: 'type'}]
    };
  }



  protected readonly getFaitColors = getFaitColors;

  ngOnDestroy(): void {

  }
}
