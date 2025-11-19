import {Component} from '@angular/core';
import {ApiSyncableObject, ApiUs} from "../../../../../../shared";
import {LOG, LoggerContext} from "ngx-wcore";
import {getTableDescription, tableDescription} from "../../../../DataClasses/models/sync-obj-utilities";
import {ExcavationStatus} from "../../../../../../shared/objects/models/enums/ExcavationStatus";
import {CastorRowGenereicItemComponent} from "../castor-row-genereic-item/castor-row-genereic-item.component";

const CONTEXT: LoggerContext = {
  origin: 'CastorRowItemUsComponent'
}

@Component({
  selector: 'app-castor-row-item-us',
  templateUrl: './castor-row-item-us.component.html',
  styleUrls: ['./castor-row-item-us.component.scss']
})
export class CastorRowItemUsComponent extends CastorRowGenereicItemComponent {

  get us(): ApiUs {
    return this.object.item as ApiUs;
  }

  info: tableDescription;
  labelBackgroundColor: string;

  constructor() {
    super();
  }


  init(object: ApiSyncableObject) {
    LOG.debug.log({...CONTEXT, action: 'init()'}, object);
    this.info = getTableDescription(this.us.table);
    if (this.us?.us_stat) {
      this.setLabelBackgroundColor();
    }
  }

  setLabelBackgroundColor() {
    switch (this.us?.us_stat) {
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
