import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiSyncableObject, ApiTopo} from "../../../../../../../shared";
import {WUtils} from "ngx-wcore";

@Component({
  selector: 'app-direct-link-list-topo-display',
  templateUrl: './direct-link-list-topo-display.component.html',
  styleUrls: ['./direct-link-list-topo-display.component.scss']
})
export class DirectLinkListTopoDisplayComponent implements OnInit, OnChanges {

  @Input() topoListObject: Array<ApiSyncableObject>;
  topoList: Array<ApiTopo>;

  constructor() { }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.topoListObject) {
      this.init();
    }
  }

  init() {
    this.topoList = WUtils.deepCopy(this.topoListObject) as Array<ApiTopo>;
  }

}
