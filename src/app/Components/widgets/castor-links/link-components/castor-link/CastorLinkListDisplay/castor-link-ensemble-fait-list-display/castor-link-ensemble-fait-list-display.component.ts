import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {
  ApiDbTable,
  ApiEnsemble,
  ApiFait,
  ApiLinkEnsembleFait
} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-ensemble-fait-list-display',
  templateUrl: './castor-link-ensemble-fait-list-display.component.html',
  styleUrls: ['./castor-link-ensemble-fait-list-display.component.scss']
})
export class CastorLinkEnsembleFaitListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkEnsembleFait>, fait: dbBoundObject<ApiFait>, ensemble: dbBoundObject<ApiEnsemble> }>;


  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkEnsembleFait>,
        fait: this.extractobject(ApiDbTable.fait, relation) as dbBoundObject<ApiFait>,
        ensemble: this.extractobject(ApiDbTable.ensemble, relation) as dbBoundObject<ApiEnsemble>
      })
    });
  }

}
