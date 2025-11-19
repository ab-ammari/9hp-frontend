import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiContenant, ApiSyncableObject} from "../../../../../../shared";
import {WUtils} from "ngx-wcore";

@Component({
  selector: 'app-castor-row-item-contenant',
  templateUrl: './castor-row-item-contenant.component.html',
  styleUrls: ['./castor-row-item-contenant.component.scss']
})
export class CastorRowItemContenantComponent implements OnInit, OnChanges {

  @Input() object: ApiSyncableObject;
  contenant: ApiContenant;

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
   this.contenant = WUtils.deepCopy(this.object) as ApiContenant;
  }

}
