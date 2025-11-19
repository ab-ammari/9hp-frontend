import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {ApiDbTable, ApiEchantillon, ApiLinkTopoEchantillon, ApiTopo} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-topo-echantillon-list-display',
  templateUrl: './castor-link-topo-echantillon-list-display.component.html',
  styleUrls: ['./castor-link-topo-echantillon-list-display.component.scss']
})
export class CastorLinkTopoEchantillonListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkTopoEchantillon>, topo: dbBoundObject<ApiTopo>, echantillon: dbBoundObject<ApiEchantillon> }>;


  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkTopoEchantillon>,
        topo: this.extractobject(ApiDbTable.topo, relation) as dbBoundObject<ApiTopo>,
        echantillon: this.extractobject(ApiDbTable.echantillon, relation) as dbBoundObject<ApiEchantillon>
      })
    });
  }

}
