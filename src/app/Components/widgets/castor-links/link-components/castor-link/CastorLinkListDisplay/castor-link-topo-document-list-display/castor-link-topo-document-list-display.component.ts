import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {ApiDbTable, ApiDocument, ApiLinkDocumentTopo, ApiTopo} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-topo-document-list-display',
  templateUrl: './castor-link-topo-document-list-display.component.html',
  styleUrls: ['./castor-link-topo-document-list-display.component.scss']
})
export class CastorLinkTopoDocumentListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkDocumentTopo>, topo: dbBoundObject<ApiTopo>, document: dbBoundObject<ApiDocument> }>;
  arrayDoc: Array<dbBoundObject<ApiDocument>>;
  ApiDbTable = ApiDbTable;

  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkDocumentTopo>,
        topo: this.extractobject(ApiDbTable.topo, relation) as dbBoundObject<ApiTopo>,
        document: this.extractobject(ApiDbTable.document, relation) as dbBoundObject<ApiDocument>
      })
    });
    this.arrayDoc = this.relations.map(item => item.document);
  }

}
