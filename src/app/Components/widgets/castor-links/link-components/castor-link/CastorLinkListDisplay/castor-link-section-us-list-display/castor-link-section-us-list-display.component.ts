import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {ApiDbTable, ApiLinkSectionUs, ApiSection, ApiUs} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-section-us-list-display',
  templateUrl: './castor-link-section-us-list-display.component.html',
  styleUrls: ['./castor-link-section-us-list-display.component.scss']
})
export class CastorLinkSectionUsListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkSectionUs>, section: dbBoundObject<ApiSection>, us: dbBoundObject<ApiUs> }>;


  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkSectionUs>,
        section: this.extractobject(ApiDbTable.section, relation) as dbBoundObject<ApiSection>,
        us: this.extractobject(ApiDbTable.us, relation) as dbBoundObject<ApiUs>
      })
    });
  }

}
