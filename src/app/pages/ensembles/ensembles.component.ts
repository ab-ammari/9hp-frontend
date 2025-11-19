import { Component, OnInit } from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {ApiDbTable, ApiEnsemble, ApiSynchroFrontInterfaceEnum} from "../../../../shared";
import {tap} from "rxjs/operators";
import {A} from "../../Core-event";

@Component({
  selector: 'app-ensembles',
  templateUrl: './ensembles.component.html',
  styleUrls: ['./ensembles.component.scss']
})
export class EnsemblesComponent implements OnInit {
  ApiDbTable = ApiDbTable;

  constructor(public w: WorkerService) { }

  ngOnInit(): void {
  }

  goToCreateEnsemble() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_ENSEMBLE_NEW});
  }

  gotToDetailsEnsemble(ensemble: ApiEnsemble) {
    this.w.data().objects.ensemble.selected.select(ensemble.ensemble_uuid).pipe(tap(() => {
      this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_ENSEMBLE_DETAILS});
    })).subscribe();
  }

  markAsDelete(ensemble: ApiEnsemble) {
    ensemble.live = false;
    this.w.data().objects.ensemble.selected?.commit(ensemble).subscribe();
  }

}
