import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {ApiContenant, ApiDbTable, ApiSecteur, ApiSyncableObject, ApiTypeCategory} from "../../../../../shared";
import {tap} from "rxjs/operators";
import {WorkerService} from "../../../services/worker.service";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";

@Component({
  selector: 'app-new-contenant-form',
  templateUrl: './new-contenant-form.component.html',
  styleUrls: ['./new-contenant-form.component.scss']
})
export class NewContenantFormComponent implements OnInit {

  @Output() onContenantCreated = new EventEmitter();
  @Output() onCancelBtnClicked = new EventEmitter();

  selectedSectorUuid: string;
  selectedSector: dbBoundObject<ApiSecteur>;
  contenantType: string;

  ApiTypeCategory = ApiTypeCategory;

  constructor(public w: WorkerService) { }

  ngOnInit(): void {
  }

  createNewContenant() {
    if (this.w.data()?.user?.user_uuid
      && this.w.data()?.projet?.selected?.item?.projet_uuid) {
      const newContenant: ApiContenant = {
        contenant_uuid: null,
        created: null,
        type_contenant_uuid: this.contenantType ?? null,
        live: true,
        projet_uuid: this.w.data()?.projet?.selected?.item?.projet_uuid,
        table: ApiDbTable.contenant,
        tag: null,
        tag_hash: null,
        author_uuid: this.w.data()?.user?.user_uuid,
        versions: []
      }
      this.w.data().objects.contenant.selected?.commit(newContenant).pipe(tap((value) => {
        const newContenant: ApiContenant = value[0] as ApiContenant;
        this.onContenantCreated.emit(newContenant.contenant_uuid);
      })).subscribe();
    }
  }

}
