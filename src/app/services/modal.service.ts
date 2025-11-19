import { Injectable } from '@angular/core';
import {ModalController} from "@ionic/angular";
import {
  LinkCustomField,
  LinkObjectCreatedModalComponent
} from "../Components/widgets/link-object-created-modal/link-object-created-modal.component";
import {ApiDbTable, ApiDocument, ApiSyncableFile, ApiSyncableObject} from "../../../shared";
import {dbBoundObject} from "../DataClasses/models/db-bound-object";
import {LinkSelection} from "./castor-object-context.service";
import {OverlayEventDetail} from "@ionic/core";
import {CastorImageGalleryComponent} from "../Components/Display/castor-image-gallery/castor-image-gallery.component";
import {from, lastValueFrom, of} from "rxjs";
import {LOG, LoggerContext} from "ngx-wcore";

const CONTEXT: LoggerContext = {
  origin: 'ModalService'
};

export interface ModalDismissObject extends OverlayEventDetail<OverlayEventDetailData> {

}

export interface OverlayEventDetailData {
  objectUuid: string,
  customField: LinkCustomField
}


@Injectable({
  providedIn: 'root'
})
export class ModalService {

  private imageCreationModal: HTMLIonModalElement;

  constructor(private modalCtrl: ModalController) { }

  async openObjectCreationLinkModal(reference: dbBoundObject<ApiSyncableObject>,
                                    target: LinkSelection, sectorUuid?: string, faitUuid?: string, usUuid?: string) {

    const modal = await this.modalCtrl.create({
      component: LinkObjectCreatedModalComponent,
      componentProps: {reference: reference, target: target, sectorUuid: sectorUuid, faitUuid: faitUuid, usUuid: usUuid},
      cssClass: 'linkObjectCreatedModal',
    });

    await modal.present();

    const result: ModalDismissObject = await modal.onWillDismiss();
    return result.data;
  }

  public async closeImageGalleryModal(): Promise<boolean> {
    LOG.info.log({...CONTEXT, action: 'closeImageGalleryModal', message: 'Closing image gallery modal'});
    if (this.imageCreationModal) {
      LOG.info.log({...CONTEXT, action: 'closeImageGalleryModal', message: 'Image gallery modal exists, dismissing'});
      const result = await this.imageCreationModal.dismiss();
      this.imageCreationModal = null;
      LOG.info.log({...CONTEXT, action: 'closeImageGalleryModal', message: 'Image gallery modal dismissed'});
      return result;
    } else {
      LOG.warn.log({...CONTEXT, action: 'closeImageGalleryModal', message: 'No image gallery modal to close'});
      return lastValueFrom(of(null));
    }
  }

  public async openImageGalleryModal(
    file: ApiSyncableFile,
    carousel: Array<ApiSyncableFile>
  ) {
    LOG.info.log({...CONTEXT, action: 'openImageGalleryModal', message: 'Opening image gallery modal for file'}, file?.file_uuid);

    if (!file) {
      LOG.error.log({...CONTEXT, action: 'openImageGalleryModal', message: 'Cannot open modal: file is null or undefined'});
      return null;
    }

    LOG.info.log({...CONTEXT, action: 'openImageGalleryModal', message: 'Closing any existing image gallery modal'});
    await this.closeImageGalleryModal();

    LOG.info.log({...CONTEXT, action: 'openImageGalleryModal', message: 'Creating new image gallery modal'});
    this.imageCreationModal = await this.modalCtrl.create({
      component: CastorImageGalleryComponent,
      componentProps: {
        file: file,
        carousel: carousel
      },
      cssClass: 'castorImageGalleryModal',
    });

    LOG.info.log({...CONTEXT, action: 'openImageGalleryModal', message: 'Presenting image gallery modal'});
    await this.imageCreationModal.present();
    LOG.info.log({...CONTEXT, action: 'openImageGalleryModal', message: 'Image gallery modal presented'});

    const result: ModalDismissObject = await this.imageCreationModal.onWillDismiss();
    LOG.info.log({...CONTEXT, action: 'openImageGalleryModal', message: 'Image gallery modal will dismiss'});
    return result.data;
  }






}
