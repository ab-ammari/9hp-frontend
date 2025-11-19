import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiFait, ApiSyncableObject} from "../../../../../../../shared";
import {WUtils} from "ngx-wcore";

@Component({
  selector: 'app-direct-link-list-fait-display',
  templateUrl: './direct-link-list-fait-display.component.html',
  styleUrls: ['./direct-link-list-fait-display.component.scss']
})
export class DirectLinkListFaitDisplayComponent implements OnInit, OnChanges {

  @Input() faitListObject: Array<ApiSyncableObject>;
  faitList: Array<ApiFait>;

  constructor() { }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.faitListObject) {
      this.init();
    }
  }

  init() {
    this.faitList = WUtils.deepCopy(this.faitListObject) as Array<ApiFait>;
  }

}
