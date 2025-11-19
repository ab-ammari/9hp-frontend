import { Component, OnInit } from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {Router} from "@angular/router";
import {ApiDbTable, ApiEchantillonPrelevement, ApiSynchroFrontInterfaceEnum} from "../../../../shared";
import {tap} from "rxjs/operators";
import {A} from "../../Core-event";

@Component({
  selector: 'app-prelevement',
  templateUrl: './prelevement.component.html',
  styleUrls: ['./prelevement.component.scss']
})
export class PrelevementComponent implements OnInit {
  ApiDbTable = ApiDbTable;

  constructor(public w: WorkerService) { }

  ngOnInit(): void {
  }

  goToCreatePrelevement() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_PRELEVEMENT_NEW});
  }

  goToPrelevementDetails(prelevement: ApiEchantillonPrelevement) {
    this.w.data().objects.echantillon.selected.select(prelevement.echantillon_uuid).pipe(tap(() => {
      this.w.trigger(A.requestNavigateTo,
        {location: ApiSynchroFrontInterfaceEnum.INTERFACE_PRELEVEMENT_DETAILS});
    })).subscribe();
  }

  markAsDelete(prelevement: ApiEchantillonPrelevement) {
    prelevement.live = false;
    this.w.data().objects.echantillon.selected.commit(prelevement).subscribe();
  }
}
