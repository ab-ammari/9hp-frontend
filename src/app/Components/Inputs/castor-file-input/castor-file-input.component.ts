import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {v4} from "uuid";
import {LOG, LoggerContext} from "ngx-wcore";
import {ApiDbTable, ApiSyncableFile} from "../../../../../shared";
import {UI} from "../../../util/ui";
import {DB} from "../../../Database/DB";
import {WorkerService} from "../../../services/worker.service";
import {Location} from "@angular/common";
import {FileService} from "../../../services/file.service";

const CONTEXT: LoggerContext = {
  origin: 'CastorFileInputComponent'
}

@Component({
  selector: 'app-castor-file-input',
  templateUrl: './castor-file-input.component.html',
  styleUrls: ['./castor-file-input.component.scss']
})
export class CastorFileInputComponent implements OnInit {

  photoLabel: string;
  file_url: string;
  @Input() file_uuid: string;
  @Output() file_uuidChange = new EventEmitter();

  constructor(
    public w: WorkerService,
    private location: Location,
    private photo: FileService) {
  }

  ngOnInit(): void {
  }

  takeNewPhoto() {
    this.photo.addNewToGallery().then((result) => {
      this.file_url = result.url;
      this.file_uuid = v4();
      LOG.debug.log({...CONTEXT, action: 'takeNewPhoto'}, result.blob, result);
      const file: ApiSyncableFile = {
        table: ApiDbTable.file,
        created: Date.now(),
        draft: true,
        file_uuid: this.file_uuid,
        file: result.blob,
        projet_uuid: UI.state.store.projet_uuid
      };
      DB.database.file.save(file).subscribe((next) => {
        this.file_uuidChange.emit(file.file_uuid);
      });
    });
  }
}
