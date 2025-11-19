import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiSyncableObject, ApiUs} from "../../../../../../../shared";
import {WUtils} from "ngx-wcore";

@Component({
  selector: 'app-direct-link-list-us-display',
  templateUrl: './direct-link-list-us-display.component.html',
  styleUrls: ['./direct-link-list-us-display.component.scss']
})
export class DirectLinkListUsDisplayComponent implements OnInit, OnChanges {

  @Input() usListObject: Array<ApiSyncableObject>;
  usList: Array<ApiUs>

  constructor() { }

  ngOnInit(): void {
    this.init();
  }

  init() {
    this.usList = WUtils.deepCopy(this.usListObject) as Array<ApiUs>;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.usListObject) {
      this.init();
    }
  }

}
