import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiDbTable, ApiDocumentPhoto, ApiSecteur, ApiSyncableObject, TagSystem} from "../../../../../shared";
import {tap} from "rxjs/operators";
import {WorkerService} from "../../../services/worker.service";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-new-photo-form',
  templateUrl: './new-photo-form.component.html',
  styleUrls: ['./new-photo-form.component.scss']
})
export class NewPhotoFormComponent implements OnInit {

  @Output() onPhotoCreated = new EventEmitter();
  @Output() onCancelBtnClicked = new EventEmitter();
  @Input() sectorUuid: string;

  sectionSeletionTitle: string = 'Sélection du secteur';

  file_uuid: string;
  selected_secteur: dbBoundObject<ApiSyncableObject>;
  get isTagSystemSector(): boolean {
    return this.w.data().isTagSystem(ApiDbTable.document_photo, TagSystem.SECTEUR);
  }

  constructor( public w: WorkerService) { }

  ngOnInit(): void {
    if (this.isTagSystemSector) {
      this.sectionSeletionTitle += '*';
    }
    if (this.sectorUuid) {
      this.selected_secteur = this.w.data().objects.secteur.all.findByUuid(this.sectorUuid);
    }
  }

  createNewPhoto() {
    if (this.w.data()?.user?.user_uuid
      && this.w.data()?.projet?.selected?.item?.projet_uuid) {
      const newPhoto: ApiDocumentPhoto = {
        secteur_uuid: (this.selected_secteur?.item as ApiSecteur)?.secteur_uuid,
        created: null,
        document_photo_uuid: null,
        document_uuid: null,
        photo_state_uuid: null,
        document_file_uuid: this.file_uuid,
        live: true,
        photo_plaque: false,
        projet_uuid: this.w.data().projet.selected.item.projet_uuid,
        table: ApiDbTable.document_photo,
        tag: null,
        tag_hash: null,
        author_uuid: this.w.data().user.user_uuid,
        versions: []
      }
      this.w.data().objects.document.selected.commit(newPhoto).pipe(tap((value) => {
        const newPhoto: ApiDocumentPhoto = value[0] as ApiDocumentPhoto;
        this.onPhotoCreated.emit(newPhoto.document_uuid);
      })).subscribe();
    }
  }

  isValidNewPhotoForm(): boolean {
    if (this.isTagSystemSector) {
      return !!this.selected_secteur;
    } else {
      return true;
    }
  }

}
