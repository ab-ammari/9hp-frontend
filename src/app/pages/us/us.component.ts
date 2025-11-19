import { Component, OnInit } from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {tap} from "rxjs/operators";
import {A} from "../../Core-event";
import {ApiDbTable, ApiSynchroFrontInterfaceEnum, ApiUs} from "../../../../shared";
import {Manager} from "../../util/utilitysingletons/activity-manager";

@Component({
  selector: 'app-us',
  templateUrl: './us.component.html',
  styleUrls: ['./us.component.scss']
})
export class UsComponent implements OnInit {
  ApiDbTable = ApiDbTable;

  constructor(public w: WorkerService) { }

  ngOnInit(): void {
  }

  goToCreateUs() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_US_NEW});
  }

  goToUsDetails(us: ApiUs) {
    this.w.data().objects.us.selected.select(us.us_uuid).pipe(tap(() => {
      this.w.trigger(A.requestNavigateTo,
        {location: ApiSynchroFrontInterfaceEnum.INTERFACE_US_DETAILS});
    })).subscribe();
  }

  markAsDelete(us: ApiUs) {
    us.live = false;
    this.w.data().objects.us.selected?.commit(us).subscribe();
  }

  protected readonly Manager = Manager;
}
