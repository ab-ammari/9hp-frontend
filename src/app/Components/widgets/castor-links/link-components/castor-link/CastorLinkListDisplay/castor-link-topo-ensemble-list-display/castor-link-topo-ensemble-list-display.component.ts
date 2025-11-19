import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {ApiDbTable, ApiEnsemble, ApiLinkTopoEnsemble, ApiTopo} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-topo-ensemble-list-display',
  templateUrl: './castor-link-topo-ensemble-list-display.component.html',
  styleUrls: ['./castor-link-topo-ensemble-list-display.component.scss']
})
export class CastorLinkTopoEnsembleListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkTopoEnsemble>, topo: dbBoundObject<ApiTopo>, ensemble: dbBoundObject<ApiEnsemble> }>;
  arrayTopo: Array<dbBoundObject<ApiTopo>>;


  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkTopoEnsemble>,
        topo: this.extractobject(ApiDbTable.topo, relation) as dbBoundObject<ApiTopo>,
        ensemble: this.extractobject(ApiDbTable.ensemble, relation) as dbBoundObject<ApiEnsemble>
      })
    });
   this.arrayTopo = this.relations?.map(item => item.topo);
  }

}
