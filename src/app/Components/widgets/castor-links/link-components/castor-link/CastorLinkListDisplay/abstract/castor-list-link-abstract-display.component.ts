import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiDbTable, ApiSyncableObject} from "../../../../../../../../../shared";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";
import {LinkList} from "../../../../../../../services/castor-object-context.service";

@Component({
  selector: 'app-castor-list-link-abstract-display',
  templateUrl: './castor-list-link-abstract-display.component.html',
  styleUrls: ['./castor-list-link-abstract-display.component.scss']
})
export abstract class CastorListLinkAbstractDisplayComponent implements OnInit, OnChanges {

  @Input() list: LinkList;
  isReference: ApiDbTable;

  ngOnInit(): void {
    this.init();
    this.isReference = this.list.reference.ref_table
  }

  ngOnChanges(changes: SimpleChanges) {
    this.init();
    this.isReference = this.list.reference.ref_table
  }

  abstract init();

  protected extractobject(
    table: ApiDbTable,
    rel: { relation: dbBoundLink<ApiSyncableObject>, reference: dbBoundObject<ApiSyncableObject>, target: dbBoundObject<ApiSyncableObject> }): dbBoundObject<ApiSyncableObject> {
    return (rel.target.info.ref_table === table ? rel.target : rel.reference);
  }
}
