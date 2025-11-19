import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiDbTable, ApiEchantillonMobilier, ApiSyncableObject} from "../../../../../../../shared";

@Component({
  selector: 'app-direct-link-list-mobilier-display',
  templateUrl: './direct-link-list-mobilier-display.component.html',
  styleUrls: ['./direct-link-list-mobilier-display.component.scss']
})
export class DirectLinkListMobilierDisplayComponent implements OnInit, OnChanges {

  @Input() mobilierListObject: Array<ApiSyncableObject>;
  mobilierList: Array<ApiEchantillonMobilier>;

  constructor() { }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.mobilierListObject) {
      this.init();
    }
  }

  init() {
    this.mobilierList = this.mobilierListObject
      .filter(object => object.table === ApiDbTable.echantillon_mobilier) as Array<ApiEchantillonMobilier>;
  }

}
