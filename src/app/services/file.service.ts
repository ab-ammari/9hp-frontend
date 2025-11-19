import {Injectable} from '@angular/core';
import {Camera, CameraResultType, CameraSource} from "@capacitor/camera";
import {Photo} from "@capacitor/camera/dist/esm/definitions";
import {LOG, LoggerContext} from "ngx-wcore";
import {Castor_AWS} from "../util/dev";
import {DB} from "../Database/DB";
import {ApiDbTable, ApiSyncableFile} from "../../../shared";
import {blobToUrl} from "../util/utils";

const CONTEXT: LoggerContext = {
  origin: 'PhotoService'
}

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor() {
  }

  public async addNewToGallery(): Promise<{ url: string, blob: Blob }> {

    const capturedPhoto: Photo = await Camera.getPhoto({
      quality: 100,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      saveToGallery: true,
      width: 5000,
      height: 5000,
      source: CameraSource.Prompt
    });
    // Take a photo

    LOG.debug.log({...CONTEXT, action: 'addNewToGallery'}, capturedPhoto);

    const blob: Blob = await (await fetch(capturedPhoto.webPath)).blob();

    return {url: capturedPhoto.webPath, blob: blob};
  }

  public async retrieveFile(proj_uuid: string, file_uuid: string): Promise<string> {
    if (proj_uuid && file_uuid) {
      const url: string = 'https://'
        + Castor_AWS.config.bucketName
        + '.s3.'
        + Castor_AWS.config.bucketRegion
        + '.amazonaws.com/'
        + proj_uuid
        + '/'
        + file_uuid;
      const blob: Blob = await (await fetch(url)).blob();
      const file: ApiSyncableFile = {
        file: blob,
        table: ApiDbTable.file,
        file_uuid: file_uuid,
        projet_uuid: proj_uuid,
        created: Date.now(),
      };
      DB.database.file.sync(file);
      return blobToUrl(file.file);
    } else {
      LOG.warn.log({...CONTEXT, action: 'retrieveFile', message: 'missing information'}, {proj_uuid, file_uuid});
      return null;
    }

  }


}
