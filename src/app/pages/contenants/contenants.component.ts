import { Component, OnInit } from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {ApiContenant, ApiDbTable, ApiSynchroFrontInterfaceEnum} from "../../../../shared";
import {tap} from "rxjs/operators";
import {A} from "../../Core-event";

@Component({
  selector: 'app-contenants',
  templateUrl: './contenants.component.html',
  styleUrls: ['./contenants.component.scss']
})
export class ContenantsComponent implements OnInit {
  ApiDbTable = ApiDbTable;

  constructor(public w: WorkerService) { }

  ngOnInit(): void {
  }

  goToCreateContenant() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_CONTENANTS_NEW});
  }

  gotToDetailsContenant(contenant: ApiContenant) {
    this.w.data().objects.contenant.selected.select(contenant.contenant_uuid).pipe(tap(() => {
      this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_CONTENANTS_DETAILS});
    })).subscribe();
  }

  markAsDelete(contenant: ApiContenant) {
    contenant.live = false;
    this.w.data().objects.contenant.selected?.commit(contenant).subscribe();
  }

}
