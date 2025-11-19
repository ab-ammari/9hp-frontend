import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {ApiContenant, ApiDbTable, ApiEchantillon, ApiLinkContenantEchantillon,} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-contenant-echantillon-list-display',
  templateUrl: './castor-link-contenant-echantillon-list-display.component.html',
  styleUrls: ['./castor-link-contenant-echantillon-list-display.component.scss']
})
export class CastorLinkContenantEchantillonListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkContenantEchantillon>, contenant: dbBoundObject<ApiContenant>, echantillon: dbBoundObject<ApiEchantillon> }>;


  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkContenantEchantillon>,
        contenant: this.extractobject(ApiDbTable.contenant, relation) as dbBoundObject<ApiContenant>,
        echantillon: this.extractobject(ApiDbTable.echantillon, relation) as dbBoundObject<ApiEchantillon>
      })
    });
  }

}
