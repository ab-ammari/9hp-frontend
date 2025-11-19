import {Component, OnInit} from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {tap} from "rxjs/operators";
import {A} from "../../Core-event";
import {ApiDbTable, ApiSection, ApiSectionSondage, ApiSynchroFrontInterfaceEnum} from "../../../../shared";

@Component({
  selector: 'app-section',
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.scss']
})
export class SectionComponent implements OnInit {
  ApiDbTable = ApiDbTable;

  constructor(public w: WorkerService) {
  }


  ngOnInit(): void {
  }

  goToCreateSondage() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_SONDAGE_NEW});
  }

  gotToDetailsSondage(sondage: ApiSection) {
    this.w.data().objects.section.selected.select(sondage.section_uuid).pipe(tap(() => {
      this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_SONDAGE_DETAILS});
    })).subscribe();
  }

  markAsDelete(sondage: ApiSection) {
    sondage.live = false;
    this.w.data().objects.section.selected.commit(sondage as ApiSectionSondage).subscribe();
  }

}
