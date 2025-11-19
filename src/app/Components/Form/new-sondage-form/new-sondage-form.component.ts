import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {tap} from "rxjs/operators";
import {WorkerService} from "../../../services/worker.service";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {LOG, LoggerContext} from "ngx-wcore";
import {ApiDbTable, ApiSecteur, ApiSectionCoupe, ApiSectionSondage, ApiTypeCategory} from "../../../../../shared";

const CONTEXT: LoggerContext = {
  origin: 'NewSondageFormComponent'
}
interface RadioCreatedTypeSelection {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-new-sondage-form',
  templateUrl: './new-sondage-form.component.html',
  styleUrls: ['./new-sondage-form.component.scss']
})
export class NewSondageFormComponent implements OnInit {

  @Output() onSondageCreated = new EventEmitter();
  @Output() onCancelBtnClicked = new EventEmitter();
  /* For object link created */
  @Input() hideRadioSelector: boolean = false;
  @Input() disableRadioSelector: boolean = false;
  @Input() isLinkSondage: boolean = false;
  @Input() sectorUuid: string;
  @Input() isLink: boolean = false;

  createdTypeSelected: 'sondage' | 'coupe' = 'sondage';
  radioSelections: Array<RadioCreatedTypeSelection> = [
    { value: 'coupe', viewValue: 'Coupe'},
    { value: 'sondage', viewValue: 'Sondage'}
  ];

  selectedSectorUuid: string;
  selected_sector: dbBoundObject<ApiSecteur>;

  selectedSectionTypeUuid: string;

  constructor(public w: WorkerService) { }

  ngOnInit(): void {
    if (this.disableRadioSelector && this.isLinkSondage) {
      this.createdTypeSelected = 'sondage';
    } else if (this.disableRadioSelector && !this.isLinkSondage) {
      this.createdTypeSelected = 'coupe';
    }
    if (this.sectorUuid) {
      this.selectedSectorUuid = this.sectorUuid;
      this.selected_sector = this.w.data().objects.secteur.all.findByUuid(this.sectorUuid);
    }
  }

  createNewSondage() {

      switch (this.createdTypeSelected) {
        case "sondage":
          const newSondage: ApiSectionSondage = {
            secteur_uuid: this.selectedSectorUuid,
            created: null,
            live: true,
            projet_uuid: this.w.data().projet.selected.item.projet_uuid,
            section_sondage_uuid: null,
            section_uuid: null,
            section_type: this.selectedSectionTypeUuid,
            table: ApiDbTable.section_sondage,
            tag: null,
            author_uuid: this.w.data().user.user_uuid,
            versions: []
          }
          this.w.data().objects.section.selected.commit(newSondage).pipe(tap((value) => {
            const newSondage: ApiSectionSondage = value[0] as ApiSectionSondage;
            this.onSondageCreated.emit(newSondage.section_uuid);
          })).subscribe();
          break;
        case "coupe":
          const newCoupe: ApiSectionCoupe = {
            secteur_uuid: this.selectedSectorUuid,
            created: null,
            live: true,
            projet_uuid: this.w.data().projet.selected.item.projet_uuid,
            section_coupe_uuid: null,
            section_type: this.selectedSectionTypeUuid,
            section_uuid: null,
            table: ApiDbTable.section_coupe,
            tag: null,
            author_uuid: this.w.data().user.user_uuid,
            versions: []
          }
          this.w.data().objects.section.selected.commit(newCoupe).pipe(tap((value) => {
            const newSondage: ApiSectionSondage = value[0] as ApiSectionSondage;
            this.onSondageCreated.emit(newSondage.section_uuid);
          })).subscribe();
          break;
      }
  }

  isValidForm(): boolean {
    return !!(this.selected_sector && this.createdTypeSelected);
  }

  protected readonly ApiTypeCategory = ApiTypeCategory;
}
