import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiSection, ApiSyncableObject} from "../../../../../../shared";
import {WUtils} from "ngx-wcore";

@Component({
  selector: 'app-castor-row-item-section',
  templateUrl: './castor-row-item-section.component.html',
  styleUrls: ['./castor-row-item-section.component.scss']
})
export class CastorRowItemSectionComponent implements OnInit, OnChanges {

  @Input() object: ApiSyncableObject;
  section: ApiSection;

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
    this.section = WUtils.deepCopy(this.object) as ApiSection;
  }

}
