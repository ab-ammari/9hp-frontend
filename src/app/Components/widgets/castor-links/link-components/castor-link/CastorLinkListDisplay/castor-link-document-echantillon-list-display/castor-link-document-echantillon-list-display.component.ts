import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {ApiDbTable, ApiDocument, ApiEchantillon, ApiLinkDocumentEchantillon,} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-document-echantillon-list-display',
  templateUrl: './castor-link-document-echantillon-list-display.component.html',
  styleUrls: ['./castor-link-document-echantillon-list-display.component.scss']
})
export class CastorLinkDocumentEchantillonListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkDocumentEchantillon>, echantillon: dbBoundObject<ApiEchantillon>, document: dbBoundObject<ApiDocument> }>;
  arrayDoc: Array<dbBoundObject<ApiDocument>>;
  arrayEchantillon: Array<dbBoundObject<ApiEchantillon>>;

  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkDocumentEchantillon>,
        echantillon: this.extractobject(ApiDbTable.echantillon, relation) as dbBoundObject<ApiEchantillon>,
        document: this.extractobject(ApiDbTable.document, relation) as dbBoundObject<ApiDocument>
      })
    });
    this.arrayDoc = this.relations.map(item => item.document);
    this.arrayEchantillon = this.relations.map(item => item.echantillon);
  }

}
