import {Component, Input, OnInit} from '@angular/core';
import {dbBoundObject} from "../../../../../../../../DataClasses/models/db-bound-object";
import {ApiDbTable, ApiDocument} from "../../../../../../../../../../shared";

@Component({
  selector: 'app-castor-link-document-table-display',
  templateUrl: './castor-link-document-table-display.component.html',
  styleUrls: ['./castor-link-document-table-display.component.scss']
})
export class CastorLinkDocumentTableDisplayComponent implements OnInit {

  @Input() documents: Array<dbBoundObject<ApiDocument>>;

  ApiDbTable = ApiDbTable;

  constructor() { }

  ngOnInit(): void {
  }

}
