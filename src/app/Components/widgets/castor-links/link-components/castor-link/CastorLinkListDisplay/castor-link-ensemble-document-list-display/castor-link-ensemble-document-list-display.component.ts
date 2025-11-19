import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {
  ApiDbTable,
  ApiDocument,
  ApiEnsemble,
  ApiLinkDocumentEnsemble,
} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-ensemble-document-list-display',
  templateUrl: './castor-link-ensemble-document-list-display.component.html',
  styleUrls: ['./castor-link-ensemble-document-list-display.component.scss']
})
export class CastorLinkEnsembleDocumentListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkDocumentEnsemble>, document: dbBoundObject<ApiDocument>, ensemble: dbBoundObject<ApiEnsemble> }>;
  arrayDoc: Array<dbBoundObject<ApiDocument>>;
  ApiDbTable = ApiDbTable;

  constructor() {
    super()
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkDocumentEnsemble>,
        ensemble: this.extractobject(ApiDbTable.ensemble, relation) as dbBoundObject<ApiEnsemble>,
        document: this.extractobject(ApiDbTable.document, relation) as dbBoundObject<ApiDocument>
      })
    });
    this.arrayDoc = this.relations.map(item => item.document);
  }

}
