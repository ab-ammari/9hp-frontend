import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {
  ApiDbTable,
  ApiDocument,
  ApiLinkDocumentUs,
  ApiUs
} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-document-us-list-display',
  templateUrl: './castor-link-document-us-list-display.component.html',
  styleUrls: ['./castor-link-document-us-list-display.component.scss']
})
export class CastorLinkDocumentUsListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkDocumentUs>, us: dbBoundObject<ApiUs>, document: dbBoundObject<ApiDocument> }>;
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
        relation: relation.relation as dbBoundLink<ApiLinkDocumentUs>,
        us: this.extractobject(ApiDbTable.us, relation) as dbBoundObject<ApiUs>,
        document: this.extractobject(ApiDbTable.document, relation) as dbBoundObject<ApiDocument>
      })
    });
    this.arrayDoc = this.relations.map(item => item.document);

  }

}
