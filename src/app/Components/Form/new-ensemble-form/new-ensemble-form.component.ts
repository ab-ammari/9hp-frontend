import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {ApiDbTable, ApiEnsemble, ApiSyncableObject, ApiTypeCategory, TagSystem} from "../../../../../shared";
import {tap} from "rxjs/operators";
import {WorkerService} from "../../../services/worker.service";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-new-ensemble-form',
  templateUrl: './new-ensemble-form.component.html',
  styleUrls: ['./new-ensemble-form.component.scss']
})
export class NewEnsembleFormComponent implements OnInit {

  @Output() onEnsembleCreated = new EventEmitter();
  @Output() onCancelBtnClicked = new EventEmitter();

  uniqueId: string;
  ApiTypeCategory = ApiTypeCategory;
  custom_tag: string;
  isCustomTagSystem: boolean = false;
  selected_secteur: dbBoundObject<ApiSyncableObject>;
  get isTagSystemSector(): boolean {
    return this.w.data().isTagSystem(ApiDbTable.ensemble, TagSystem.SECTEUR);
  }
  constructor(public w: WorkerService) { }

  ngOnInit(): void {
    this.isCustomTagSystem = this.w.data().projet.selected.item.config.tags.find(tag => tag.table_name === ApiDbTable.ensemble).tag_custom;
  }
  createNewEnsemble() {
    if (this.w.data()?.user?.user_uuid
      && this.w.data()?.projet?.selected?.item?.projet_uuid) {
      const newEnsemble: ApiEnsemble = {
        created: null,
        ensemble_uuid: null,
        secteur_uuid: this.selected_secteur?.uuid ?? null,
        live: true,
        projet_uuid: this.w.data()?.projet?.selected?.item?.projet_uuid,
        table: ApiDbTable.ensemble,
        tag: null,
        tag_custom: this.custom_tag,
        tag_hash: null,
        ensemble_identification_uuid: this.uniqueId,
        author_uuid: this.w.data().user.user_uuid,
        versions: []
      }
      this.w.data().objects.ensemble.selected.commit(newEnsemble).pipe(tap((value) => {
        const newEnsemble: ApiEnsemble = value[0] as ApiEnsemble;
        this.onEnsembleCreated.emit(newEnsemble.ensemble_uuid);
      })).subscribe();
    }
  }

}
