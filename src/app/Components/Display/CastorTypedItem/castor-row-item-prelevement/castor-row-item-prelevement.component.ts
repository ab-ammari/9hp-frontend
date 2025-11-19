import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiEchantillonPrelevement, ApiSyncableObject} from "../../../../../../shared";
import {WUtils} from "ngx-wcore";

@Component({
  selector: 'app-castor-row-item-prelevement',
  templateUrl: './castor-row-item-prelevement.component.html',
  styleUrls: ['./castor-row-item-prelevement.component.scss']
})
export class CastorRowItemPrelevementComponent implements OnInit, OnChanges {

  @Input() object: ApiSyncableObject;
  prelevement: ApiEchantillonPrelevement;

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
    this.prelevement = WUtils.deepCopy(this.object) as ApiEchantillonPrelevement;
  }

}
