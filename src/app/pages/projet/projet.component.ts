import {Component, OnDestroy, OnInit} from '@angular/core';
import {catchError, Subject} from "rxjs";
import {WorkerService} from "../../services/worker.service";
import {A} from "../../Core-event";
import {ApiSynchroFrontInterfaceEnum, ApiTypeCategory} from "../../../../shared";
import {DataActions} from 'shared/actions/data-actions';
import {PopoverController} from "@ionic/angular";
import {
  CastorSyncProgressDisplayComponent
} from "../../Components/Display/castor-sync-progress-display/castor-sync-progress-display.component";
import {tap} from "rxjs/operators";


@Component({
  selector: 'app-projet',
  templateUrl: './projet.component.html',
  styleUrls: ['./projet.component.scss']
})
export class ProjetComponent implements OnInit, OnDestroy {

  subscriber$ = new Subject();
  ApiTypeCategory = ApiTypeCategory;

  DataActions = DataActions;

  isLoading: boolean = true;

  constructor(public w: WorkerService, public popover_controller: PopoverController) {
  }

  ngOnInit() {
    this.w.data().unselectAll();
    this.w.network(DataActions.RETRIEVE_PROJETS, {}).pipe(
      tap({
      next: () => {
        this.isLoading = false;
      },
        error: err => {
          this.isLoading = false;
        }
      }),
    ).subscribe();
  }
  ngOnDestroy() {
    this.subscriber$.next(undefined);
    this.isLoading = true;
  }
  async showSyncStats() {
    const popover = await this.popover_controller.create({
      component: CastorSyncProgressDisplayComponent,
      cssClass: 'CastorSyncProgressDisplayComponentPopover'
    });
    await popover.present();
  }
  onNewProject() {
    this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_NEW});
  }

  checkIndex() {
    this.w.trigger(A.RequestInitProjectIndexed);
  }

  pauseSync() {
    this.w.data().status.syncStatus = 'pause';
  }
}
