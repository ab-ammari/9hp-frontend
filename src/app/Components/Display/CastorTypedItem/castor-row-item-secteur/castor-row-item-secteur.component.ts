import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiSecteur, ApiSyncableObject} from "../../../../../../shared";
import {WUtils} from "ngx-wcore";

@Component({
  selector: 'app-castor-row-item-secteur',
  templateUrl: './castor-row-item-secteur.component.html',
  styleUrls: ['./castor-row-item-secteur.component.scss']
})
export class CastorRowItemSecteurComponent implements OnInit, OnChanges {

  @Input() object: ApiSyncableObject;
  secteur: ApiSecteur;

  constructor() {
  }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.object) {
      this.init();
    }
  }

  init() {
    this.secteur = WUtils.deepCopy(this.object) as ApiSecteur;
  }

}
