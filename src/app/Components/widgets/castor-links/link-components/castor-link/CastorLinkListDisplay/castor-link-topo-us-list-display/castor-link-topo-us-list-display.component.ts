import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {ApiDbTable, ApiLinkTopoUs, ApiTopo, ApiUs} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-topo-us-list-display',
  templateUrl: './castor-link-topo-us-list-display.component.html',
  styleUrls: ['./castor-link-topo-us-list-display.component.scss']
})
export class CastorLinkTopoUsListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkTopoUs>, topo: dbBoundObject<ApiTopo>, us: dbBoundObject<ApiUs> }>;

  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkTopoUs>,
        topo: this.extractobject(ApiDbTable.topo, relation) as dbBoundObject<ApiTopo>,
        us: this.extractobject(ApiDbTable.us, relation) as dbBoundObject<ApiUs>
      })
    });
  }

}
