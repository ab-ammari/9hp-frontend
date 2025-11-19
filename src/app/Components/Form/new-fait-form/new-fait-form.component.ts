import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiDbTable, ApiFait, ApiSecteur, ApiTypeCategory} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {LOG, LoggerContext} from "ngx-wcore";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";

const CONTEXT: LoggerContext = {
  origin: 'NewFaitFormComponent'
}
@Component({
  selector: 'app-new-fait-form',
  templateUrl: './new-fait-form.component.html',
  styleUrls: ['./new-fait-form.component.scss']
})
export class NewFaitFormComponent implements OnInit {

  @Output() onFaitCreated = new EventEmitter();
  @Output() onCancelBtnClicked = new EventEmitter();

  @Input() sectorUuid: string;

  faitIdentification: string;
  ApiTypeCategory = ApiTypeCategory;
  selectedSecteur: dbBoundObject<ApiSecteur>;
  constructor(public w: WorkerService) { }

  ngOnInit(): void {
    if (this.sectorUuid) {
     this.selectedSecteur = this.w.data().objects.secteur.all.findByUuid(this.sectorUuid)
    }
  }

  createNewFait() {
      const newFait: ApiFait = {
        created: null,
        fait_amount: 1,
        projet_uuid: this.w.data().projet.selected.item.projet_uuid,
        fait_uuid: null,
        live: true,
        secteur_uuid: this.selectedSecteur?.uuid ?? null,
        table: ApiDbTable.fait,
        tag: null,
        tag_hash: null,
        fait_dim_reel_long: true,
        fait_dim_reel_larg: true,
        fait_dim_reel_hauteur: true,
        fait_dim_reel_diameter: true,
        fait_identification_uuid: this.faitIdentification,
        fait_stat_uuid: 'cde82d36-4c81-46e6-9613-1435556a948a',
        author_uuid: this.w.data()?.user?.user_uuid,
        versions: [],
      }
      this.w.data().objects.fait.selected.commit(newFait).subscribe((value) => {
        //Emit fait uuid
        const newFait: ApiFait = value[0] as ApiFait;
        this.onFaitCreated.emit(newFait.fait_uuid);
      });
  }

  isValidNewFaitForm(): boolean {
    return !!this.selectedSecteur;
  }

}
