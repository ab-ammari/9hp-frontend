import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {dbBoundObject} from "../../../../../DataClasses/models/db-bound-object";
import {
  ApiDbTable,
  ApiEchantillon,
  ApiFait,
  ApiSecteur,
  ApiSection,
  ApiSyncableObject,
  ApiUs
} from "../../../../../../../shared";
import {dbBoundObjectList} from "../../../../../DataClasses/models/db-bound-object-list";
import {
  genericContentDescription
} from "../../../../Display/generic-content-table/objects/generic-content-object-table.component";
import {WorkerService} from "../../../../../services/worker.service";
import {LOG, LoggerContext} from "ngx-wcore";
import {LinkSelection} from "../../../../../services/castor-object-context.service";

const CONTEXT: LoggerContext = {
  origin: 'DirectLinkDisplayComponent'
}

@Component({
  selector: 'app-direct-link-display',
  templateUrl: './direct-link-display.component.html',
  styleUrls: ['./direct-link-display.component.scss']
})
export class DirectLinkDisplayComponent implements OnInit, OnChanges {

  @Input() reference: dbBoundObject<ApiSyncableObject>;
  @Input() boundList: dbBoundObjectList<ApiSyncableObject>;
  @Input() target: LinkSelection;

  list: Array<ApiSyncableObject>;
  bound_list: Array<dbBoundObject<ApiSyncableObject>>;

  genericTableDescription: genericContentDescription;

  ApiDbTable = ApiDbTable;

  constructor(private w: WorkerService) {
  }

  ngOnInit(): void {
    this.generateList();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.generateList();
  }


  generateList() {
    LOG.debug.log({...CONTEXT, action: 'generateList'}, this.reference, this.boundList, this.target);
    const link_us_list: Array<dbBoundObject<ApiUs>> = [];

    if (this.reference.info.ref_table === ApiDbTable.secteur) {
      link_us_list.push(...this.w.data().objects.us.all.list
        .filter(us => us.item.secteur_uuid === (this.reference.item as ApiSecteur).secteur_uuid));
    } else if (this.reference.info.ref_table === ApiDbTable.fait) {
      link_us_list.push(...this.w.data().objects.us.all.list
        .filter(us => us.item.fait_uuid === (this.reference.item as ApiFait).fait_uuid));
    } else if (this.reference.info.ref_table === ApiDbTable.section) {
      //
    } else {
      LOG.warn.log({...CONTEXT, action: 'generateList', message: 'HOW did you get here ???'}, this.reference, this.reference.info);
    }

    this.bound_list = this.boundList.list.filter(item => {
      if ([ApiDbTable.secteur, ApiDbTable.fait].includes(this.reference.info.ref_table) && item.info.ref_table === ApiDbTable.echantillon) {
        return link_us_list.some(us => us.item.us_uuid === (item.item as ApiEchantillon).us_uuid);
      } else {
        return (item.info.obj_table === this.target.info.obj_table || (this.target.info.parentType && this.target.info.child_tables.includes(item.info.obj_table)))
          && item.item[this.reference.info.uuid_paths[0]] === this.reference.item[this.reference.info.uuid_paths[0]]
      }
    });
    this.list = this.bound_list.map(item => item.item);
    this.genericTableDescription = null;

  }


}
