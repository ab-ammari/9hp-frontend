import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiDbTable, ApiDocumentMinute, ApiSyncableObject} from "../../../../../../../shared";

@Component({
  selector: 'app-direct-link-list-minute-display',
  templateUrl: './direct-link-list-minute-display.component.html',
  styleUrls: ['./direct-link-list-minute-display.component.scss']
})
export class DirectLinkListMinuteDisplayComponent implements OnInit, OnChanges {

  @Input() minuteListObject: Array<ApiSyncableObject>;
  minuteList: Array<ApiDocumentMinute>;

  constructor() { }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.minuteListObject) {
      this.init();
    }
  }

  init() {
    this.minuteList = this.minuteListObject
      .filter(minute => minute.table === ApiDbTable.document_minute) as Array<ApiDocumentMinute>;
  }

}
