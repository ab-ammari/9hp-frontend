import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {ApiDbTable, ApiSynchroFrontInterfaceEnum} from "../../../../shared";
import {DataActions} from "../../../../shared/actions/data-actions";
import {A} from "../../Core-event";
import {QueryParamsHandling} from "@angular/router";
import {tap} from "rxjs/operators";
import {Utils} from "../../util/utils";
import {ModalController, Platform, PopoverController} from "@ionic/angular";
import {
  CastorSyncProgressDisplayComponent
} from "../../Components/Display/castor-sync-progress-display/castor-sync-progress-display.component";
import {
  TechnicalSettingsComponent
} from "../../Components/widgets/technical-settings/technical-settings.component";

@Component({
  selector: 'app-split-pane-menu',
  templateUrl: './split-pane-menu.component.html',
  styleUrls: ['./split-pane-menu.component.scss']
})
export class SplitPaneMenuComponent implements OnInit, OnDestroy {

  ApiSynchroFrontInterfaceEnum = ApiSynchroFrontInterfaceEnum;

  appVersion = Utils.appInfo().version;
  ApiDbTable = ApiDbTable;

  private readonly indexActions = [DataActions.RETRIEVE_OBJECTS, DataActions.RETRIEVE_PROJET_INDEX];

  constructor(
    public w: WorkerService, 
    public platform: Platform, 
    public popover_controller: PopoverController,
    private modalController: ModalController
  ) {

  }

   ngOnInit() {

  }
  async ngOnDestroy() {
    this.w.data().unselectAll();
  }

  navigateTo(location: ApiSynchroFrontInterfaceEnum) {
    let queryParamsHandling: QueryParamsHandling = 'preserve';
    if (location === ApiSynchroFrontInterfaceEnum.INTERFACE_HOME) {
      // Reset selected stuff
      queryParamsHandling = null;
      this.w.data().projet.selected.select(null).pipe(
        tap(() => {
          this.w.trigger(A.requestNavigateTo, {location: location, queryParamsHandling});
        })
      ).subscribe();
    } else {
      this.w.trigger(A.requestNavigateTo, {location: location, queryParamsHandling});
    }
  }

  closeProject() {
    this.navigateTo(ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_LIST);
  }

  async showSyncStats() {
    const popover = await this.popover_controller.create({
      component: CastorSyncProgressDisplayComponent,
      cssClass: 'CastorSyncProgressDisplayComponentPopover'
    });
    await popover.present();
  }

  async openTechnicalSettings() {
    const modal = await this.modalController.create({
      component: TechnicalSettingsComponent,
      cssClass: 'technical-settings-modal'
    });
    await modal.present();
  }

  get showActivityIndicator(): boolean {
    const objectsToFetch = this.w.data().objectsToFetch?.length ?? 0;
    const archivePending = this.w.data().archive?.pending ?? 0;

    const hasNetwork = this.w.hasAnyActionsPending();
    const fetchingIndex = objectsToFetch > 0 && this.w.hasAnyOfPending(this.indexActions);
    const syncingDrafts = archivePending > 0 && this.w.hasActionPending(DataActions.SYNC_OBJECT);

    return hasNetwork || fetchingIndex || syncingDrafts;
  }
}
