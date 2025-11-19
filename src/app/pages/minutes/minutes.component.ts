import { Component, OnInit } from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {tap} from "rxjs/operators";
import {A} from "../../Core-event";
import {ApiDbTable, ApiDocumentMinute, ApiSynchroFrontInterfaceEnum} from "../../../../shared";

@Component({
  selector: 'app-minutes',
  templateUrl: './minutes.component.html',
  styleUrls: ['./minutes.component.scss']
})
export class MinutesComponent implements OnInit {
  ApiDbTable = ApiDbTable;

  constructor(public w: WorkerService) { }

  ngOnInit(): void {
  }

  goToCreateMinute() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_MINUTE_NEW});
  }

  goToMinuteDetails(document: ApiDocumentMinute) {
    this.w.data().objects.document.selected.select(document.document_uuid).pipe(tap(() => {
      this.w.trigger(A.requestNavigateTo,
        {location: ApiSynchroFrontInterfaceEnum.INTERFACE_MINUTE_DETAILS});
    })).subscribe();
  }

  markAsDelete(minute: ApiDocumentMinute) {
    minute.live = false;
    this.w.data().objects.document.selected.commit(minute).subscribe();
  }
}
