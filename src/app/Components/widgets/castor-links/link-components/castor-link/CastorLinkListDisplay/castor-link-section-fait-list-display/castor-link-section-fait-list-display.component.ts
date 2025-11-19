import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {ApiDbTable, ApiFait, ApiLinkSectionFait, ApiSection} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-section-fait-list-display',
  templateUrl: './castor-link-section-fait-list-display.component.html',
  styleUrls: ['./castor-link-section-fait-list-display.component.scss']
})
export class CastorLinkSectionFaitListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkSectionFait>, fait: dbBoundObject<ApiFait>, section: dbBoundObject<ApiSection> }>;

  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkSectionFait>,
        fait: this.extractobject(ApiDbTable.fait, relation) as dbBoundObject<ApiFait>,
        section: this.extractobject(ApiDbTable.section, relation) as dbBoundObject<ApiSection>
      })
    });
  }

}
