import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {ApiDbTable, ApiEchantillonMobilier, ApiSecteur, ApiTypeCategory, ApiUs, TagSystem} from "../../../../../shared";
import {tap} from "rxjs/operators";
import {WorkerService} from "../../../services/worker.service";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-new-mobilier-form',
  templateUrl: './new-mobilier-form.component.html',
  styleUrls: ['./new-mobilier-form.component.scss']
})
export class NewMobilierFormComponent implements OnInit, OnChanges {

  @Output() onMobilierCreated = new EventEmitter();
  @Output() onCancelBtnClicked = new EventEmitter();
  @Input() sectorUuid: string;
  @Input() usUuid: string;

  selectedUs: dbBoundObject<ApiUs>;
  material: string
  ApiTypeCategory = ApiTypeCategory;

  materialSelectionTitle: string = 'Sélectionnez un matériau';
  get isTagSystemMaterial(): boolean {
    return this.w.data().isTagSystem(ApiDbTable.echantillon_mobilier, TagSystem.MOBILIER_MATERIAU);
  }

  constructor(public w: WorkerService) { }

  ngOnInit(): void {
    if (this.isTagSystemMaterial) {
      this.materialSelectionTitle += '*';
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.usUuid) {
      this.selectedUs = this.w.data().objects.us.all.findByUuid(this.usUuid);
    }
  }

  createNewMobilier() {
      const newMobilier: ApiEchantillonMobilier = {
        created: null,
        echantillon_mobilier_uuid: null,
        projet_uuid: this.w.data().projet.selected.item.projet_uuid,
        echantillon_uuid: null,
        live: true,
        table: ApiDbTable.echantillon_mobilier,
        tag: null,
        mobilier_etat_uuid: '59a87077-a1c4-4e4e-8f1d-a94a99ba9f87',
        tag_hash: null,
        us_uuid: this.selectedUs?.uuid ?? null,
        author_uuid: this.w.data()?.user?.user_uuid,
        type_materiaux_uuid: this.material,
        versions: []
      }
      this.w.data().objects.echantillon.selected.commit(newMobilier).pipe(tap((value) => {
        const newMobilier: ApiEchantillonMobilier = value[0] as ApiEchantillonMobilier;
        this.onMobilierCreated.emit(newMobilier.echantillon_uuid);
      })).subscribe();
    }

    isValidNewMobilierForm(): boolean {
      if (this.isTagSystemMaterial) {
        return !!(this.selectedUs && this.material)
      } else {
        return !!(this.selectedUs);
      }
    }
}
