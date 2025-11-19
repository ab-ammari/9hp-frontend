import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiFait, ApiSyncableObject} from "../../../../../../shared";
import {WUtils} from "ngx-wcore";
import {ExcavationStatus} from "../../../../../../shared/objects/models/enums/ExcavationStatus";
import {WorkerService} from "../../../../services/worker.service";

@Component({
  selector: 'app-castor-row-item-fait',
  templateUrl: './castor-row-item-fait.component.html',
  styleUrls: ['./castor-row-item-fait.component.scss']
})
export class CastorRowItemFaitComponent implements OnInit, OnChanges {

  @Input() object: ApiSyncableObject;

  fait: ApiFait;
  labelBackgroundColor: string;
  tagSector: string;
  ensembleTag: Array<string>;

  constructor(private w: WorkerService) {
  }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.object) {
      this.init();
    }
  }

  init() {
    this.fait = WUtils.deepCopy(this.object) as ApiFait;
    this.getSecteurTag();
    this.getEnsemblesTag();
    if (this.fait?.fait_stat_uuid) {
      this.setTagColor();
    }
  }

  getSecteurTag() {
    this.tagSector = this.w.data()?.objects?.secteur?.all?.list?.find(sector => sector?.item?.secteur_uuid === this.fait?.secteur_uuid)?.item?.tag;
  }

  getEnsemblesTag() {
    this.ensembleTag = [];
    const linkFaitEnsemble = this.w.data().links.link_ensemble_fait.all.list.filter(item => item.item.fait_uuid === this.fait.fait_uuid);
    for (const element of linkFaitEnsemble) {
      const ensemble = this.w.data()?.objects?.ensemble?.all?.list?.find(ensemble => ensemble.item.ensemble_uuid === element.item.ensemble_uuid).item;
      this.ensembleTag.push(ensemble.tag);
    }
  }

  setTagColor() {
    switch (this.fait?.fait_stat_uuid) {
      case ExcavationStatus.UNEXCAVATED:
        this.labelBackgroundColor = '#E7411B'
        break;
      case ExcavationStatus.FIFTY_PERCENT:
        this.labelBackgroundColor = '#F49935'
        break;
      case ExcavationStatus.SONDAGE:
        this.labelBackgroundColor = "#FFD618"
        break;
      case ExcavationStatus.HUNDRED_PERCENT:
        this.labelBackgroundColor = '#76B99C'
        break;
    }
  }

}
