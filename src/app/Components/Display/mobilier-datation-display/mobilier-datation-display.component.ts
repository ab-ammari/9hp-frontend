import {Component, Input, OnInit} from '@angular/core';
import {LOG, LoggerContext} from "ngx-wcore";
import {WorkerService} from "../../../services/worker.service";
import {ApiDbTable, ApiEchantillonMobilier} from "../../../../../shared";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";

const CONTEXT: LoggerContext = {
  origin: 'MobilierDatationDisplay'
}

@Component({
  selector: 'app-mobilier-datation-display',
  templateUrl: './mobilier-datation-display.component.html',
  styleUrls: ['./mobilier-datation-display.component.scss']
})
export class MobilierDatationDisplayComponent implements OnInit {

  @Input() usUuid: string;
  @Input() faitUuid: string;

  constructor(private w: WorkerService) {
  }

  displayedMobilierDatationUuid: string;

  ngOnInit(): void {
    if (this.usUuid) {
      this.initMobilierUS();
    } else if (this.faitUuid) {
      this.initMobilierFait();
    } else {
      LOG.debug.log({...CONTEXT}, 'wtf shouln\'d happen !!');
    }

  }


  initMobilierUS() {
    const usMobilier = this.w.data().objects.echantillon.all
      ?.childList(ApiDbTable.echantillon_mobilier)
      ?.find(mobilier => mobilier.item.us_uuid === this.usUuid) as dbBoundObject<ApiEchantillonMobilier>;

    this.displayedMobilierDatationUuid = usMobilier?.item?.mobilier_datation_uuid;
  }

  initMobilierFait() {
  }

}
