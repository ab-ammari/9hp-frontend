import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {LOG, LoggerContext} from "ngx-wcore";
import {ApiDbTable, ApiSyncableObject} from "../../../../../../shared";
import {LinkList, LinkTriplet} from "../../../../services/castor-object-context.service";
import {dbBoundLink} from "../../../../DataClasses/models/db-bound-link";
import {Subject} from "rxjs";

const CONTEXT: LoggerContext = {
  origin: 'GenericContentTableComponent'
}

@Component({
  selector: 'app-generic-content-table',
  templateUrl: './generic-content-table.component.html',
  styleUrls: ['./generic-content-table.component.scss']
})
export class GenericContentTableComponent implements OnInit, OnChanges {

  @Input() generic_table: genericTableDescription;

  ApiDbTable = ApiDbTable;


  constructor() {
  }

  ngOnInit(): void {
  }
  ngOnChanges(changes: SimpleChanges) {
    LOG.debug.log({...CONTEXT, action: 'ngOnChanges'}, this.generic_table);
  }

  protected readonly dbBoundLink = dbBoundLink;
}

export type genericTableDescriptionvalueListMapType = string | number | Date | boolean |  LinkTriplet;
export interface genericTableDescription {
  headers: Array<genericTableColumn>; // contains the description of every available column in the table and the header to display
  value_list: Array<Map<string, genericTableDescriptionvalueListMapType>>; // contains a list of all the values mapped to a key available in the header.
  link_list: LinkList;
}

export interface genericTableColumn {
  origin: 'reference' | 'target' | 'relation'; /// where does data come from
  label: string; // header label
  format: 'string' | 'number' | 'date' | 'boolean' | 'tag' | 'type' | 'otherTag' | 'EditRelation' | 'image'; // format of the value of the column. 'otherTag' : Tag of another object in relation / 'tag' Tag of the object himself
  color?: (object: ApiSyncableObject) => string;
  key: string; // key to retrieve the value from the provided Map
  otherTagTable?: ApiDbTable;
}
