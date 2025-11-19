import {Component, EventEmitter, Input, OnInit, Output, SimpleChanges} from '@angular/core';
import {ApiDbTable, ApiFait, ApiSyncableObject, ApiTopo, ApiTypeCategory, TagSystem} from "../../../../../shared";
import {tap} from "rxjs/operators";
import {WorkerService} from "../../../services/worker.service";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-new-topo-form',
  templateUrl: './new-topo-form.component.html',
  styleUrls: ['./new-topo-form.component.scss']
})
export class NewTopoFormComponent implements OnInit {

  @Output() onTopoCreated = new EventEmitter();
  @Output() onCancelBtnClicked = new EventEmitter();
  @Input() sectorUuid: string;
  @Input() faitUuid: string;

  selectedTopoType: string;
  ApiTypeCategory = ApiTypeCategory;

  selected_fait: dbBoundObject<ApiSyncableObject>;
  selected_secteur: dbBoundObject<ApiSyncableObject>;

  creating: boolean = false;
  error: string;

  get tagSystemFait(): boolean {
    return this.w.data().isTagSystem(ApiDbTable.topo, TagSystem.FAIT);
  }
  get tagSystemSector(): boolean {
    return this.w.data().isTagSystem(ApiDbTable.topo, TagSystem.SECTEUR);
  }

  constructor(public w: WorkerService) { }

  ngOnInit(): void {
    if (this.sectorUuid) {
      this.selected_secteur = this.w.data().objects.secteur.all.findByUuid(this.sectorUuid)
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.faitUuid) {
      this.selected_fait = this.w.data().objects.fait.all.findByUuid(this.faitUuid);
    }
  }



  createNewTopo() {
    if (this.w.data()?.user?.user_uuid
      && this.w.data()?.projet?.selected?.item?.projet_uuid) {
      const newTopo: ApiTopo = {
        created: null,
        live: true,
        topo_type_uuid: this.selectedTopoType ?? null,
        projet_uuid: this.w.data().projet.selected.item.projet_uuid,
        table: ApiDbTable.topo,
        tag: null,
        tag_hash: null,
        topo_levee: false,
        topo_uuid: null,
        secteur_uuid: this.selected_secteur?.uuid ?? null,
        fait_uuid: this.selected_fait?.uuid ?? null,
        author_uuid: this.w.data().user.user_uuid,
        versions: []
      }
      this.creating = true;
      this.w.data().objects.topo.selected.commit(newTopo).pipe(tap((value) => {
        const newTopo: ApiTopo = value[0] as ApiTopo;
        this.onTopoCreated.emit(newTopo.topo_uuid);
        this.creating = false;
      })).subscribe({
        next: value => {
          this.creating = false;
          this.error = null;
        },
        error: err => {
          this.creating = false;
          this.error = err;
        }
      });
    }
  }

  isValidNewTopoForm(): boolean {
    // if (this.tagSystemSector) {
    //   return !!this.selected_secteur;
    // } else {
    //   return true;
    // }
    return !!this.selected_secteur;
  }

}
