import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {ApiDbTable, ApiSyncableFile} from "../../../../../shared";
import {ModalService} from "../../../services/modal.service";
import {ModalController} from "@ionic/angular";
import {DB} from "../../../Database/DB";
import {CastorFileDisplayComponent} from "../castor-file-display/castor-file-display.component";
import {LOG, LoggerContext} from "ngx-wcore";
import {WorkerService} from "../../../services/worker.service";
import {CastorZoomContainerComponent} from "../castor-zoom-container/castor-zoom-container.component";

const CONTEXT: LoggerContext = {
  origin: 'CastorImageGalleryComponent'
}

@Component({
  selector: 'app-castor-image-gallery',
  templateUrl: './castor-image-gallery.component.html',
  styleUrls: ['./castor-image-gallery.component.scss']
})
export class CastorImageGalleryComponent implements OnInit {

  @Input() file: ApiSyncableFile;
  @ViewChild('fileDisplay') fileDisplay: CastorFileDisplayComponent;
  @ViewChild('zoomContainer') zoomContainer: CastorZoomContainerComponent;

  @Input() carousel: Array<ApiSyncableFile> = [];

  private currentIndex: number = -1;

  constructor(
    public modal: ModalService,
    private modalCtrl: ModalController,
    private w: WorkerService,
  ) {

  }

  ngOnInit(): void {
    LOG.info.log({...CONTEXT, action: 'ngOnInit', message: 'Initializing with file'}, this.file);
    if (!this.file) {
      LOG.error.log({...CONTEXT, action: 'ngOnInit', message: 'No file provided to the component'});
      return;
    }
    LOG.info.log({...CONTEXT, action: 'ngOnInit', message: 'File table type'}, this.file.table);
    LOG.info.log({...CONTEXT, action: 'ngOnInit', message: 'File UUID'}, this.file.file_uuid);
  }


  async closeModal() {
    LOG.info.log({...CONTEXT, action: 'closeModal', message: 'Closing modal'});
    await this.modalCtrl.dismiss();
  }

  nextFile() {
    LOG.info.log({...CONTEXT, action: 'nextFile', message: 'Next file requested'});

    if (this.carousel.length <= 1) {
      LOG.warn.log({...CONTEXT, action: 'nextFile', message: 'No other files to navigate to (length <= 1)'});
      return;
    }

    const oldIndex = this.currentIndex;

    // Move to the next file in the list, wrapping around to the beginning if necessary
    this.currentIndex = (this.currentIndex + 1) % this.carousel.length;
    LOG.info.log({...CONTEXT, action: 'nextFile', message: `Navigating from index ${oldIndex} to ${this.currentIndex}`});

    const oldFileUuid = this.file.file_uuid;
    this.file = this.carousel[this.currentIndex];
    LOG.info.log({...CONTEXT, action: 'nextFile', message: `Changing file from ${oldFileUuid} to ${this.file.file_uuid}`});

    // Update the file display component
    if (this.fileDisplay) {
      LOG.info.log({...CONTEXT, action: 'nextFile', message: 'Updating file display component'});
      this.fileDisplay.file_uuid = this.file.file_uuid;
      this.fileDisplay.generateUrl();
    } else {
      LOG.error.log({...CONTEXT, action: 'nextFile', message: 'File display component reference not found'});
    }

    // Reset zoom when changing files
    if (this.zoomContainer) {
      LOG.info.log({...CONTEXT, action: 'nextFile', message: 'Resetting zoom'});
      this.zoomContainer.resetZoom();
    } else {
      LOG.error.log({...CONTEXT, action: 'nextFile', message: 'Zoom container reference not found'});
    }
  }

  previousFile() {
    LOG.info.log({...CONTEXT, action: 'previousFile', message: 'Previous file requested'});

    if (this.carousel.length <= 1) {
      LOG.warn.log({...CONTEXT, action: 'previousFile', message: 'No other files to navigate to (length <= 1)'});
      return;
    }

    const oldIndex = this.currentIndex;

    // Move to the previous file in the list, wrapping around to the end if necessary
    this.currentIndex = (this.currentIndex - 1 + this.carousel.length) % this.carousel.length;
    LOG.info.log({...CONTEXT, action: 'previousFile', message: `Navigating from index ${oldIndex} to ${this.currentIndex}`});

    const oldFileUuid = this.file.file_uuid;
    this.file = this.carousel[this.currentIndex];
    LOG.info.log({...CONTEXT, action: 'previousFile', message: `Changing file from ${oldFileUuid} to ${this.file.file_uuid}`});

    // Update the file display component
    if (this.fileDisplay) {
      LOG.info.log({...CONTEXT, action: 'previousFile', message: 'Updating file display component'});
      this.fileDisplay.file_uuid = this.file.file_uuid;
      this.fileDisplay.generateUrl();
    } else {
      LOG.error.log({...CONTEXT, action: 'previousFile', message: 'File display component reference not found'});
    }

    // Reset zoom when changing files
    if (this.zoomContainer) {
      LOG.info.log({...CONTEXT, action: 'previousFile', message: 'Resetting zoom'});
      this.zoomContainer.resetZoom();
    } else {
      LOG.error.log({...CONTEXT, action: 'previousFile', message: 'Zoom container reference not found'});
    }
  }
}
