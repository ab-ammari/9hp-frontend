import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiSyncableObject, ApiTopo} from "../../../../../../shared";
import {WUtils} from "ngx-wcore";

@Component({
  selector: 'app-castor-row-item-topo',
  templateUrl: './castor-row-item-topo.component.html',
  styleUrls: ['./castor-row-item-topo.component.scss']
})
export class CastorRowItemTopoComponent implements OnInit, OnChanges {

  @Input() object: ApiSyncableObject;
  topo: ApiTopo;

  constructor() { }

  ngOnInit(): void {
    this.init()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.object) {
      this.init();
    }
  }

  init() {
    this.topo = WUtils.deepCopy(this.object) as ApiTopo;
  }

}
