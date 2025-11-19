import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {A} from "../../Core-event";
import {ApiDbTable, ApiSecteur, ApiSynchroFrontInterfaceEnum, ApiTypeCategory} from "../../../../shared";
import {Subject} from "rxjs";
import {LoggerContext} from "ngx-wcore";


const CONTEXT: LoggerContext = {
  origin: 'SecteurComponent'
}

@Component({
  selector: 'app-secteur',
  templateUrl: './secteur.component.html',
  styleUrls: ['./secteur.component.scss']
})

export class SecteurComponent implements OnInit, OnDestroy {
  ApiTypeCategory = ApiTypeCategory;
  global_search: string;

  $subsciber: Subject<null> = new Subject<null>();
  ApiDbTable = ApiDbTable;

  constructor(public w: WorkerService) {
  }

  ngOnInit(): void {
  }

  goToCreateSector() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_SECTOR_NEW});
  }

  goToSectorDetails(sector: ApiSecteur) {
    console.log("On view sector go to details", sector.secteur_uuid);
    this.w.data().objects.secteur.selected.select(sector.secteur_uuid).subscribe(() => {
      this.w.trigger(A.requestNavigateTo,
        {location: ApiSynchroFrontInterfaceEnum.INTERFACE_SECTOR_DETAILS, queryParamsHandling: 'preserve'});
    });
  }

  markAsDelete(sector: ApiSecteur) {
    sector.live = false;
    this.w.data().objects.secteur.selected.commit(sector).subscribe();
  }

  ngOnDestroy() {
    this.$subsciber.next(undefined);
  }


  onBack() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_DASH});
  }
}

