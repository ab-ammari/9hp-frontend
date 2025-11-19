import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {ApiDbTable, ApiLinkTopoSection, ApiSection, ApiTopo} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-topo-section-list-display',
  templateUrl: './castor-link-topo-section-list-display.component.html',
  styleUrls: ['./castor-link-topo-section-list-display.component.scss']
})
export class CastorLinkTopoSectionListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkTopoSection>, topo: dbBoundObject<ApiTopo>, section: dbBoundObject<ApiSection> }>;
  arraySections: Array<dbBoundObject<ApiSection>>;
  arrayTopos: Array<dbBoundObject<ApiTopo>>;

  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkTopoSection>,
        topo: this.extractobject(ApiDbTable.topo, relation) as dbBoundObject<ApiTopo>,
        section: this.extractobject(ApiDbTable.section, relation) as dbBoundObject<ApiSection>
      })
    });
    this.arraySections = this.relations.map(item => item.section);
    this.arrayTopos = this.relations.map(item => item.topo);
  }

}
