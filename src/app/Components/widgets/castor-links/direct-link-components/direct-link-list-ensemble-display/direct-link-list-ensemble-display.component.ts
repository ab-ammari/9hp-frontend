import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiEnsemble, ApiSyncableObject} from "../../../../../../../shared";
import {WUtils} from "ngx-wcore";

@Component({
  selector: 'app-direct-link-list-ensemble-display',
  templateUrl: './direct-link-list-ensemble-display.component.html',
  styleUrls: ['./direct-link-list-ensemble-display.component.scss']
})
export class DirectLinkListEnsembleDisplayComponent implements OnInit, OnChanges {

  @Input() ensembleListObject: Array<ApiSyncableObject>;
  ensembleList: Array<ApiEnsemble>;

  constructor() { }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.ensembleListObject) {
      this.init();
    }
  }

  init() {
    this.ensembleList = WUtils.deepCopy(this.ensembleListObject) as Array<ApiEnsemble>;
  }

}
