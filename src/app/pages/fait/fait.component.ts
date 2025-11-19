import { Component, OnInit } from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {tap} from "rxjs/operators";
import {A} from "../../Core-event";
import {ApiDbTable, ApiFait, ApiLinkTopoFait, ApiSynchroFrontInterfaceEnum, ApiTopo} from "../../../../shared";

@Component({
  selector: 'app-fait',
  templateUrl: './fait.component.html',
  styleUrls: ['./fait.component.scss']
})
export class FaitComponent implements OnInit {
  ApiDbTable = ApiDbTable;

  constructor(public w: WorkerService) { }

  ngOnInit(): void {
  }

  goToCreateFait() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_FAIT_NEW});
  }

  goToFaitDetails(fait: ApiFait) {
    this.w.data().objects.fait.selected?.select(fait.fait_uuid).pipe(tap(() => {
      this.w.trigger(A.requestNavigateTo,
        {location: ApiSynchroFrontInterfaceEnum.INTERFACE_FAIT_DETAILS})
    })).subscribe();
  }

  markAsDelete(fait: ApiFait) {
    fait.live = false;
    this.w.data().objects.fait.selected?.commit(fait).subscribe();

  }
}
