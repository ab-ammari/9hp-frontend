import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiDbTable, ApiEchantillonPrelevement, ApiSyncableObject} from "../../../../../../../shared";

@Component({
  selector: 'app-direct-link-list-prelevement-display',
  templateUrl: './direct-link-list-prelevement-display.component.html',
  styleUrls: ['./direct-link-list-prelevement-display.component.scss']
})
export class DirectLinkListPrelevementDisplayComponent implements OnInit, OnChanges {

  @Input() prelevementListObject: Array<ApiSyncableObject>;
  prelevementList: Array<ApiEchantillonPrelevement>;

  constructor() { }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.prelevementListObject) {
      this.init();
    }
  }

  init() {
    this.prelevementList = this.prelevementListObject
      .filter(prelevement => prelevement.table === ApiDbTable.echantillon_prelevement) as Array<ApiEchantillonPrelevement>;
  }

}
