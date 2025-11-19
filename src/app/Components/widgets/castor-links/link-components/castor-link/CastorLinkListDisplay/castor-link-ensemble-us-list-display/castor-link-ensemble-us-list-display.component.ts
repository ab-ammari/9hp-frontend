import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {ApiDbTable, ApiEnsemble, ApiLinkEnsembleUs, ApiUs} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-ensemble-us-list-display',
  templateUrl: './castor-link-ensemble-us-list-display.component.html',
  styleUrls: ['./castor-link-ensemble-us-list-display.component.scss']
})
export class CastorLinkEnsembleUsListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkEnsembleUs>, ensemble: dbBoundObject<ApiEnsemble>, us: dbBoundObject<ApiUs> }>;


  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkEnsembleUs>,
        us: this.extractobject(ApiDbTable.us, relation) as dbBoundObject<ApiUs>,
        ensemble: this.extractobject(ApiDbTable.ensemble, relation) as dbBoundObject<ApiEnsemble>
      })
    });
  }

}
