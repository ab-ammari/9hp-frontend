import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiEnsemble, ApiFait, ApiSyncableObject} from "../../../../../../shared";
import {WUtils} from "ngx-wcore";
import {WorkerService} from "../../../../services/worker.service";

@Component({
  selector: 'app-castor-row-item-ensemble',
  templateUrl: './castor-row-item-ensemble.component.html',
  styleUrls: ['./castor-row-item-ensemble.component.scss']
})
export class CastorRowItemEnsembleComponent implements OnInit, OnChanges {

  @Input() object: ApiSyncableObject;
  ensemble: ApiEnsemble;

  faitUsList: Array<string> = [];

  constructor(private w: WorkerService) { }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.object) {
      this.init();
    }
  }

  init() {
    this.ensemble = WUtils.deepCopy(this.object) as ApiEnsemble;
    this.getFaitUsList();
  }

  getFaitUsList() {
    this.faitUsList = [];
   const linkOfFaitEnsemble = this.w.data().links.link_ensemble_fait.all.list.filter(item => item.item.ensemble_uuid === this.ensemble.ensemble_uuid);
    for (const linkFaitEnsemble of linkOfFaitEnsemble) {
     const fait = this.w.data().objects.fait.all.list.find(fait => fait.item.fait_uuid === linkFaitEnsemble.item.fait_uuid).item;
      this.faitUsList.push(fait.tag);
    }

    const listUsEnsemble = this.w.data().links.link_ensemble_us.all.list.filter(item => item.item.ensemble_uuid === this.ensemble.ensemble_uuid);
    for (const linkUsEnsemble of listUsEnsemble) {
      const us = this.w.data().objects.us.all.list.find(us => us.item.us_uuid === linkUsEnsemble.item.us_uuid).item;
      this.faitUsList.push(us.tag);
    }
  }
}
