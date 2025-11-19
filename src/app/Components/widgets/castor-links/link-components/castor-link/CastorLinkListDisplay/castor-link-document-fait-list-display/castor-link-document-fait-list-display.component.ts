import {Component, OnInit} from '@angular/core';
import {CastorListLinkAbstractDisplayComponent} from "../abstract/castor-list-link-abstract-display.component";
import {ApiDbTable, ApiDocument, ApiFait, ApiLinkDocumentFait} from "../../../../../../../../../shared";
import {dbBoundLink} from "../../../../../../../DataClasses/models/db-bound-link";
import {dbBoundObject} from "../../../../../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-castor-link-document-fait-list-display',
  templateUrl: './castor-link-document-fait-list-display.component.html',
  styleUrls: ['./castor-link-document-fait-list-display.component.scss']
})
export class CastorLinkDocumentFaitListDisplayComponent extends CastorListLinkAbstractDisplayComponent implements OnInit {

  relations: Array<{ relation: dbBoundLink<ApiLinkDocumentFait>, fait: dbBoundObject<ApiFait>, document: dbBoundObject<ApiDocument> }>;
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
        relation: relation.relation as dbBoundLink<ApiLinkDocumentFait>,
        fait: this.extractobject(ApiDbTable.fait, relation) as dbBoundObject<ApiFait>,
        document: this.extractobject(ApiDbTable.document, relation) as dbBoundObject<ApiDocument>
      })
    });
    this.arrayDoc = this.relations.map(item => item.document);

  }


}
