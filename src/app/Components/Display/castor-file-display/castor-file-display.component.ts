import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {DB} from "../../../Database/DB";
import {mergeAll, mergeMap, tap} from "rxjs/operators";
import {blobToUrl, download} from "../../../util/utils";
import {ApiSyncableFile} from "../../../../../shared";
import {ModalService} from "../../../services/modal.service";
import {LOG, LoggerContext} from "ngx-wcore";
import {WorkerService} from "../../../services/worker.service";
import {concat, forkJoin, lastValueFrom} from "rxjs";


const CONTEXT: LoggerContext = {
  origin: 'CastorFileDisplayComponent'
}

@Component({
  selector: 'app-castor-file-display',
  templateUrl: './castor-file-display.component.html',
  styleUrls: ['./castor-file-display.component.scss']
})
export class CastorFileDisplayComponent implements OnInit, OnChanges {

  url: string;
  @Input() file_uuid: string;
  @Input() openModalOnClick: boolean = true;
  @Input() view: 'full' | 'thumbnail' = 'full';
  @Input() tag: string;
  @Input() height: string = '100%';
  @Input() width: string = '100%';
  @Input() download_button: boolean = false;
  file: ApiSyncableFile;

  constructor(
    private modalService: ModalService,
    private w: WorkerService,
  ) {
  }

  ngOnInit(): void {
    LOG.info.log({...CONTEXT, action: 'ngOnInit', message: 'Component initialized with file_uuid'}, this.file_uuid);
  }

  ngOnChanges(changes: SimpleChanges) {
    LOG.info.log({...CONTEXT, action: 'ngOnChanges', message: 'Component changes detected'}, changes);
    if (changes.file_uuid) {
      LOG.info.log({...CONTEXT, action: 'ngOnChanges', message: 'File UUID changed'}, {
        from: changes.file_uuid.previousValue,
        to: changes.file_uuid.currentValue
      });
    }
    this.generateUrl();
  }

  generateUrl() {
    LOG.info.log({...CONTEXT, action: 'generateUrl', message: 'Generating URL for file_uuid'}, this.file_uuid);
    this.url = 'https://placehold.co/600x400?text=loading';
    LOG.info.log({...CONTEXT, action: 'generateUrl', message: 'Set temporary loading URL'});

    if (this.file_uuid) {
      LOG.info.log({...CONTEXT, action: 'generateUrl', message: 'Fetching file from database'});
      DB.database.file.get(this.file_uuid).pipe(
        tap(value => {
          if (value) {
            LOG.info.log({...CONTEXT, action: 'generateUrl', message: 'File retrieved successfully'}, value.file_uuid);
            this.file = value;
            LOG.info.log({...CONTEXT, action: 'generateUrl', message: 'Converting blob to URL'});
            try {
              this.url = blobToUrl(value.file);
              LOG.info.log({...CONTEXT, action: 'generateUrl', message: 'URL generated successfully'});
            } catch (error) {
              LOG.error.log({...CONTEXT, action: 'generateUrl', message: 'Error converting blob to URL'}, error);
              this.url = 'https://placehold.co/600x400?text=error';
            }
          } else {
            LOG.error.log({...CONTEXT, action: 'generateUrl', message: 'File not found in database'});
            this.url = 'https://placehold.co/600x400?text=file+not+found';
          }
        })
      ).subscribe({
        error: (error) => {
          LOG.error.log({...CONTEXT, action: 'generateUrl', message: 'Error fetching file'}, error);
          this.url = 'https://placehold.co/600x400?text=error';
        }
      });
    } else {
      LOG.warn.log({...CONTEXT, action: 'generateUrl', message: 'No file_uuid provided'});
      this.url = 'https://placehold.co/600x400?text=no+image';
    }
  }

  retrieveRelatedFiles(uuids: Array<string>) {
    LOG.info.log({...CONTEXT, action: 'retrieveRelatedFiles', message: 'Retrieving related files'}, uuids);
    return forkJoin(uuids.map(uuid => {
      return this.w.data().objects.document.all.findByUuid(uuid).item.document_file_uuid;
    }).map(file_uuid => {
      return DB.database.file.get(file_uuid).pipe(
        tap(value => {
            LOG.info.log({...CONTEXT, action: 'retrieveRelatedFiles', message: 'Related file retrieved successfully'},file_uuid,  value);
        })
      );
    }));
  }

  protected readonly download = download;

  openModal($event: MouseEvent) {
    LOG.info.log({...CONTEXT, action: 'openModal', message: 'openModal called, openModalOnClick'}, this.openModalOnClick);
    if (this.openModalOnClick) {
      LOG.info.log({...CONTEXT, action: 'openModal', message: 'Opening image gallery modal with file'}, this.file?.file_uuid);
      $event.stopPropagation();
      if (!this.file) {
        LOG.error.log({...CONTEXT, action: 'openModal', message: 'Cannot open modal: file is null or undefined'});
        return;
      }
      this.retrieveRelatedFiles(this.w.data().context.scope.documents).pipe(
        tap((related_files) => {
          LOG.info.log({...CONTEXT, action: 'openModal', message: 'Related files retrieved successfully'}, related_files);
          this.modalService.openImageGalleryModal(this.file, related_files);
        })
      ).subscribe();
    } else {
      LOG.info.log({...CONTEXT, action: 'openModal', message: 'Modal opening skipped (openModalOnClick is false)'});
    }
  }
}
