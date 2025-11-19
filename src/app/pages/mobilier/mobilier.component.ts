import {Component, OnInit} from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {ApiDbTable, ApiEchantillonMobilier, ApiSynchroFrontInterfaceEnum} from "../../../../shared";
import {tap} from "rxjs/operators";
import {A} from "../../Core-event";

@Component({
  selector: 'app-mobilier',
  templateUrl: './mobilier.component.html',
  styleUrls: ['./mobilier.component.scss']
})
export class MobilierComponent implements OnInit {
  ApiDbTable = ApiDbTable;

  constructor(public w: WorkerService) {
  }

  ngOnInit(): void {
  }

  goToCreateMobilier() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_MOBILIER_NEW});
  }

  goToMobilierDetails(echantillon: ApiEchantillonMobilier) {
    this.w.data().objects.echantillon.selected.select(echantillon.echantillon_uuid).pipe(tap(() => {
      this.w.trigger(A.requestNavigateTo,
        {location: ApiSynchroFrontInterfaceEnum.INTERFACE_MOBILIER_DETAILS});
    })).subscribe();
  }

  markAsDelete(mobilier: ApiEchantillonMobilier) {
    mobilier.live = false;
    this.w.data().objects.echantillon.selected?.commit(mobilier).subscribe();
  }

}
