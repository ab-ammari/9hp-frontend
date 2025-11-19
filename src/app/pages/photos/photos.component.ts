import {Component, OnDestroy, OnInit} from '@angular/core';
import {tap} from "rxjs/operators";
import {A} from "../../Core-event";
import {ApiDbTable, ApiDocumentPhoto, ApiSynchroFrontInterfaceEnum} from "../../../../shared";
import {WorkerService} from "../../services/worker.service";
import {Router} from "@angular/router";
import {DEV} from "../../util/dev";
import {UI} from "../../util/ui";

const file_gallery_key = 'file_gallery_key';
@Component({
  selector: 'app-photos',
  templateUrl: './photos.component.html',
  styleUrls: ['./photos.component.scss']
})
export class PhotosComponent implements OnInit, OnDestroy {
  ApiDbTable = ApiDbTable;

  constructor(public w: WorkerService) { }

  view: boolean = false;
  ngOnInit(): void {
    this.view = !!localStorage.getItem(file_gallery_key);
  }
  ngOnDestroy() {
    if (this.view) {
      localStorage.setItem(file_gallery_key, 'gallery-view');
    } else {
      localStorage.removeItem(file_gallery_key);
    }
  }

  goToCreatePhoto() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_PHOTOS_NEW});
  }

  goToPhotoDetails(photo: ApiDocumentPhoto) {
    this.w.data().objects.document.selected.select(photo.document_uuid).pipe(tap(() => {
      this.w.trigger(A.requestNavigateTo,
        {location: ApiSynchroFrontInterfaceEnum.INTERFACE_PHOTOS_DETAILS});
    })).subscribe();
  }

  markAsDelete(photo: ApiDocumentPhoto) {
    photo.live = false;
    this.w.data().objects.document.selected.commit(photo).subscribe();
  }

  toggleView() {
    this.view = !this.view;
  }

}
