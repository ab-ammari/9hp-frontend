import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiSection, ApiSyncableObject} from "../../../../../../../shared";
import {WUtils} from "ngx-wcore";

@Component({
  selector: 'app-direct-link-list-section-display',
  templateUrl: './direct-link-list-section-display.component.html',
  styleUrls: ['./direct-link-list-section-display.component.scss']
})
export class DirectLinkListSectionDisplayComponent implements OnInit, OnChanges {

  @Input() sectionListObject: Array<ApiSyncableObject>;
  sectionList: Array<ApiSection>;

  constructor() { }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.sectionListObject) {
      this.init();
    }
  }

  init() {
    this.sectionList = WUtils.deepCopy(this.sectionListObject) as Array<ApiSection>;
  }

}
