import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiEchantillonMobilier, ApiSyncableObject} from "../../../../../../shared";
import {WUtils} from "ngx-wcore";

@Component({
  selector: 'app-castor-row-item-mobilier',
  templateUrl: './castor-row-item-mobilier.component.html',
  styleUrls: ['./castor-row-item-mobilier.component.scss']
})
export class CastorRowItemMobilierComponent implements OnInit, OnChanges {

  @Input() object: ApiSyncableObject;
  mobilier: ApiEchantillonMobilier;

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
    this.mobilier = WUtils.deepCopy(this.object) as ApiEchantillonMobilier;
  }
}
