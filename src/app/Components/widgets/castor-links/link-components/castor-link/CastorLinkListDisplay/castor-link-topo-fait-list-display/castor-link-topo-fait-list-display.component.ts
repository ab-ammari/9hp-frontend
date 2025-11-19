import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {ApiDbTable, ApiFait, ApiLinkTopoFait, ApiTopo} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-topo-fait-list-display',
  templateUrl: './castor-link-topo-fait-list-display.component.html',
  styleUrls: ['./castor-link-topo-fait-list-display.component.scss']
})
export class CastorLinkTopoFaitListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkTopoFait>, fait: dbBoundObject<ApiFait>, topo: dbBoundObject<ApiTopo> }>;

  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkTopoFait>,
        fait: this.extractobject(ApiDbTable.fait, relation) as dbBoundObject<ApiFait>,
        topo: this.extractobject(ApiDbTable.topo, relation) as dbBoundObject<ApiTopo>
      })
    });
  }

}
