import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {
  ApiDbTable,
  ApiDocumentMinute,
  ApiSecteur,
  ApiSyncableObject,
  ApiTypeCategory,
  TagSystem
} from "../../../../../shared";
import {tap} from "rxjs/operators";
import {WorkerService} from "../../../services/worker.service";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-new-minute-form',
  templateUrl: './new-minute-form.component.html',
  styleUrls: ['./new-minute-form.component.scss']
})
export class NewMinuteFormComponent implements OnInit {

  @Output() onMinuteCreated = new EventEmitter();
  @Output() onCancelBtnClicked = new EventEmitter();
  @Input() sectorUuid: string;

  sectionSeletionTitle: string = 'Sélection du secteur';

  minuteSupportUuid: string;
  file_uuid: string;
  ApiTypeCategory = ApiTypeCategory;
  selectedSector: dbBoundObject<ApiSyncableObject>;
  get isTagSystemSector(): boolean {
    return this.w.data().isTagSystem(ApiDbTable.document_minute, TagSystem.SECTEUR);
  }
  constructor(public w: WorkerService) { }

  ngOnInit(): void {
    if (this.isTagSystemSector) {
      this.sectionSeletionTitle += '*';
    }
    if (this.sectorUuid) {
      this.selectedSector = this.w.data().objects.secteur.all.findByUuid(this.sectorUuid);
    }
  }

  createNewMinute() {
    if (this.w.data()?.user?.user_uuid
      && this.w.data()?.projet?.selected?.item?.projet_uuid) {
      const newMinute: ApiDocumentMinute = {
        secteur_uuid: (this.selectedSector?.item as ApiSecteur).secteur_uuid,
        created: null,
        document_minute_uuid: null,
        document_file_uuid: this.file_uuid,
        document_uuid: null,
        minute_support: this.minuteSupportUuid,
        live: true,
        projet_uuid: this.w.data().projet.selected.item.projet_uuid,
        table: ApiDbTable.document_minute,
        minute_state_uuid: '430b2bbc-54f5-4b46-94e9-223e21bf2d1f',
        tag: null,
        tag_hash: null,
        author_uuid: this.w.data().user.user_uuid,
        versions: [],
      }
      this.w.data().objects.document.selected.commit(newMinute).pipe(tap((value) => {
        const newMinute: ApiDocumentMinute = value[0] as ApiDocumentMinute;
        this.onMinuteCreated.emit(newMinute.document_uuid);
      })).subscribe();
    }
  }

  isValidNewMinuteForm(): boolean {
    if (this.isTagSystemSector) {
      return !!this.selectedSector;
    } else {
      return true;
    }
  }

}
