import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiDocumentMinute, ApiSyncableObject} from "../../../../../../shared";
import {WUtils} from "ngx-wcore";

@Component({
  selector: 'app-castor-row-item-minute',
  templateUrl: './castor-row-item-minute.component.html',
  styleUrls: ['./castor-row-item-minute.component.scss']
})
export class CastorRowItemMinuteComponent implements OnInit, OnChanges {

  @Input() object: ApiSyncableObject;
  minute: ApiDocumentMinute;

  constructor() { }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.object) {
      this.init();
    }
  }

  init() {
    this.minute = WUtils.deepCopy(this.object) as ApiDocumentMinute;
  }

}
