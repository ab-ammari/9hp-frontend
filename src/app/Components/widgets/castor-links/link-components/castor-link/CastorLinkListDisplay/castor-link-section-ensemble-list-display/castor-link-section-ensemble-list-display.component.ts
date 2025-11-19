import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {ApiDbTable, ApiEnsemble, ApiLinkSectionEnsemble, ApiSection} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-section-ensemble-list-display',
  templateUrl: './castor-link-section-ensemble-list-display.component.html',
  styleUrls: ['./castor-link-section-ensemble-list-display.component.scss']
})
export class CastorLinkSectionEnsembleListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkSectionEnsemble>, section: dbBoundObject<ApiSection>, ensemble: dbBoundObject<ApiEnsemble> }>;

  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkSectionEnsemble>,
        ensemble: this.extractobject(ApiDbTable.ensemble, relation) as dbBoundObject<ApiEnsemble>,
        section: this.extractobject(ApiDbTable.section, relation) as dbBoundObject<ApiSection>
      })
    });
  }

}
