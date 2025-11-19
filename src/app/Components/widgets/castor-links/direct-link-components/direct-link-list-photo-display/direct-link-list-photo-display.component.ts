import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiDbTable, ApiDocumentPhoto, ApiSyncableObject} from "../../../../../../../shared";

@Component({
  selector: 'app-direct-link-list-photo-display',
  templateUrl: './direct-link-list-photo-display.component.html',
  styleUrls: ['./direct-link-list-photo-display.component.scss']
})
export class DirectLinkListPhotoDisplayComponent implements OnInit, OnChanges {

  @Input() photoListObject: Array<ApiSyncableObject>;
  photoList: Array<ApiDocumentPhoto>;

  constructor() { }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.photoListObject) {
      this.init();
    }
  }

  init() {
    this.photoList = this.photoListObject
      .filter(photo => photo.table === ApiDbTable.document_photo) as Array<ApiDocumentPhoto>;
  }

}
