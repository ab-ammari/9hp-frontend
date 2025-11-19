import {Component, EventEmitter, Input, OnInit, Output, SimpleChanges} from '@angular/core';
import {ApiDbTable, ApiEchantillonPrelevement, ApiTypeCategory, ApiUs} from "../../../../../shared";
import {tap} from "rxjs/operators";
import {WorkerService} from "../../../services/worker.service";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-new-prelevement-form',
  templateUrl: './new-prelevement-form.component.html',
  styleUrls: ['./new-prelevement-form.component.scss']
})
export class NewPrelevementFormComponent implements OnInit {

  @Output() onPrelevementCreated = new EventEmitter();
  @Output() onCancelBtnClicked = new EventEmitter();
  @Input() usUuid: string;

  selectedUs: dbBoundObject<ApiUs>;
  natureUuid: string;
  ApiTypeCategory = ApiTypeCategory;

  constructor(public w: WorkerService) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.usUuid) {
      this.selectedUs = this.w.data().objects.us.all.findByUuid(this.usUuid);
    }
  }

  createNewPrelevement() {
    if (this.w.data()?.user?.user_uuid) {
      const newPrelevement: ApiEchantillonPrelevement = {
        created: null,
        echantillon_prelevement_uuid: null,
        echantillon_uuid: null,
        prelevement_etat: '8b2e7f75-ef31-4a0b-98f2-99ec3d6dfe0d',
        projet_uuid: this.w.data().projet.selected.item.projet_uuid,
        live: true,
        table: ApiDbTable.echantillon_prelevement,
        tag: null,
        tag_hash: null,
        us_uuid: this.selectedUs?.uuid ?? null,
        author_uuid: this.w.data()?.user?.user_uuid,
        versions: [],
        type_nature_uuid: this.natureUuid
      }
      this.w.data().objects.echantillon.selected.commit(newPrelevement).pipe(tap((value) => {
        const newPrelevement: ApiEchantillonPrelevement = value[0] as ApiEchantillonPrelevement;
        this.onPrelevementCreated.emit(newPrelevement.echantillon_uuid);
      })).subscribe()
    }
  }

  isValidNewPrelevementForm(): boolean {
    return !!this.selectedUs
  }

}
