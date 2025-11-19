import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {ApiDbTable, ApiDocument, ApiSyncableObject} from "../../../../../shared";
import {CdkVirtualScrollViewport} from "@angular/cdk/scrolling";
import {genericContentDescription} from "../generic-content-table/objects/generic-content-object-table.component";

@Component({
  selector: 'app-generic-document-table',
  templateUrl: './generic-document-table.component.html',
  styleUrls: ['./generic-document-table.component.scss']
})
export class GenericDocumentTableComponent implements OnInit {

  @Input() content: genericContentDescription;
  @Input() global_filter: string;
  filtered_items: Array<dbBoundObject<ApiDocument>>;
  asDocument(val) : ApiDocument { return val; }

  @Output() onSelect: EventEmitter<dbBoundObject<ApiSyncableObject>> = new EventEmitter<dbBoundObject<ApiSyncableObject>>();

  ApiDbTable = ApiDbTable;

  constructor() { }

  ngOnInit(): void {
    this.onFilter();
  }


  onFilter(){
    this.filtered_items = this.content.content as Array<dbBoundObject<ApiDocument>>;
  }

}
