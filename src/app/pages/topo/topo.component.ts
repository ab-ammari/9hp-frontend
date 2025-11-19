import { Component, OnInit } from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {ApiDbTable, ApiSynchroFrontInterfaceEnum, ApiTopo} from "../../../../shared";
import {tap} from "rxjs/operators";
import {A} from "../../Core-event";

@Component({
  selector: 'app-topo',
  templateUrl: './topo.component.html',
  styleUrls: ['./topo.component.scss']
})
export class TopoComponent implements OnInit {
  ApiDbTable = ApiDbTable;

  constructor(public w: WorkerService) { }

  ngOnInit(): void {
  }

  gotToCreateTopo() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_TOPOS_NEW});
  }

  goToTopoDetails(topo: ApiTopo) {
    this.w.data().objects.topo.selected.select(topo.topo_uuid).pipe(tap(() => {
      this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_TOPOS_DETAILS});
    })).subscribe();
  }

  markAsDelete(topo: ApiTopo) {
    topo.live = false;
    this.w.data().objects.topo.selected.commit(topo).subscribe();
  }

}
