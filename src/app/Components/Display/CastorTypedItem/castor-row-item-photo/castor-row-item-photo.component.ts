import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiDocumentPhoto, ApiSyncableObject} from "../../../../../../shared";
import {WUtils} from "ngx-wcore";

@Component({
  selector: 'app-castor-row-item-photo',
  templateUrl: './castor-row-item-photo.component.html',
  styleUrls: ['./castor-row-item-photo.component.scss']
})
export class CastorRowItemPhotoComponent implements OnInit, OnChanges {

  @Input() object: ApiSyncableObject;
  photo: ApiDocumentPhoto;

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
    this.photo = WUtils.deepCopy(this.object) as ApiDocumentPhoto;
  }

}
