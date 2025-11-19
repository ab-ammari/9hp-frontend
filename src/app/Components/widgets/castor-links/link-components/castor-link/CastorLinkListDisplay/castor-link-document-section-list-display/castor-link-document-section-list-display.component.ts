import { Component, OnInit } from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {ApiDbTable, ApiDocument, ApiLinkDocumentSection, ApiSection} from "../../../../../../../../../shared";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-document-section-list-display',
  templateUrl: './castor-link-document-section-list-display.component.html',
  styleUrls: ['./castor-link-document-section-list-display.component.scss']
})
export class CastorLinkDocumentSectionListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkDocumentSection>, section: dbBoundObject<ApiSection>, document: dbBoundObject<ApiDocument> }>;
  ApiDbTable = ApiDbTable;

  arrayDoc: Array<dbBoundObject<ApiDocument>>;

  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  init() {
    this.relations = [];
    this.list.list.forEach((relation) => {
      this.relations.push({
        relation: relation.relation as dbBoundLink<ApiLinkDocumentSection>,
        section: this.extractobject(ApiDbTable.section, relation) as dbBoundObject<ApiSection>,
        document: this.extractobject(ApiDbTable.document, relation) as dbBoundObject<ApiDocument>
      })
    });
    this.arrayDoc = this.relations.map(item => item.document);
    console.log("doc array ", this.arrayDoc);
  }

}
