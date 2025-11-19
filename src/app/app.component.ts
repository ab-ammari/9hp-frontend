import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {SwUpdate, VersionReadyEvent} from "@angular/service-worker";
import {interval} from 'rxjs';
import {LOG, LoggerContext, SystemActions, WCoreService} from "ngx-wcore";
import {WorkerService} from "./services/worker.service";
import {NavigatorService} from "./services/navigator.service";
import {ProjetService} from "./services/castor/projet.service";
import {DB} from "./Database/DB";
import {NetworkManager} from "./util/network-manager";
import {ZoneSyncService} from "./services/zone-sync.service";
import {A} from "./Core-event";
import {ConfigurationService} from "./services/configuration.service";
import {CastorSyncService} from "./services/castor-sync.service";
import {MatIconRegistry} from "@angular/material/icon";
import {DomSanitizer} from "@angular/platform-browser";
import {getEnvironmentLevel} from "./util/dev";
import {StatsProjectService} from "./services/castor/stats-project.service";
import {filter, map, tap} from "rxjs/operators";

const CONTEXT: LoggerContext = {
  origin: 'AppComponent'
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Castor';
  DB = DB;
  /**
   * Mémorise le dernier statut réseau afin de ne logguer qu'en cas de changement effectif.
   */
  private lastNetworkStatus: boolean | null = null;

  constructor(private core: WCoreService,
              public w: WorkerService,
              public config: ConfigurationService,
              private zoneSync: ZoneSyncService,
              private updates: SwUpdate,
              private ref: ChangeDetectorRef,
              private matIconRegistry: MatIconRegistry,
              private domSanitizer: DomSanitizer,
  ) {
    this.initCustomIcon();

    document.addEventListener('RequestChangeDetection', () => {
      //LOG.debug.log('RequestChangeDetection');
      this.ref.detectChanges();
    }, false);
    // Init core services
    this.core.initCore([
      {name: 'Navigator', service: NavigatorService, initOn: SystemActions.init},
      {name: 'CastorSync', service: CastorSyncService, initOn: SystemActions.init},
      {name: 'projet', service: ProjetService, initOn: A.DBisReady},
      {name: 'stats-project', service: StatsProjectService, initOn: A.DBisReady},
    ], this.w);
    this.zoneSync.init();
    NetworkManager.status_observer.subscribe((status) => {
      if (this.lastNetworkStatus !== status) {
        LOG.info.log({...CONTEXT, action: 'PING'}, status);
        this.lastNetworkStatus = status;
      }
    });
    this.w.on(SystemActions.NETWORK_ERROR).pipe(
      tap((value) => {
        if (value?.error?.error?.code) {
         // this.toast.error(value.error.error.code, value.error.error.message);
        } else {
         // this.toast.error('NETWORK_ERROR', JSON.stringify(value));
        }
      })
    ).subscribe();

    if (!this.updates.isEnabled) {
      LOG.info.log({...CONTEXT}, 'Service worker not enable');
    } else {
      LOG.info.log({...CONTEXT}, 'Service worker enable');
    }

    this.checkUpdate();
  }

  ngOnInit(): void {

  }

  initCustomIcon() {
    /* Add custom material icon */
    this.matIconRegistry.addSvgIcon('castorSectorIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/sector-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorFaitIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/fait-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorUsIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/us-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorEnsembleIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/ensemble-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorSondageIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/sondage-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorMobilierIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/mobilier-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorPrelevementIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/prelevement-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorContenantIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/contenant-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorMinuteIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/minute-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorPhotoIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/photo-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorTopoIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/topo-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorAddNewIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/add-new-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorValidIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/valid-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorCancelIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/cancel-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorDashboardIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/dashboard-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorExitIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/exit-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorAddLinkIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/add-link-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorCalculatorIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/calculator-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorGearsIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/gears-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorAddIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/add-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorLogoIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/castor-logo-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorEyeIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/eye-icon.svg"));
    this.matIconRegistry.addSvgIcon('castorDownloadFile',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/download-file.svg"))
    this.matIconRegistry.addSvgIcon('castorChevronBack',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/chevron-back.svg"))
    this.matIconRegistry.addSvgIcon('castorChevronForward',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/chevron-forward.svg"))
    this.matIconRegistry.addSvgIcon('castorCalculator',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/calculator.svg"));
    this.matIconRegistry.addSvgIcon('castorCloseOutline',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/close-outline.svg"));
    this.matIconRegistry.addSvgIcon('castorAddNewLinkIcon',
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/castorIcons/add-new-link-icon.svg"));
  }

  get isAppReady(): boolean {
    return DB.database.isReady;
  }

  checkUpdate() {
    if (this.updates.isEnabled) {
      this.handleUpdate(); // MAJ Sub
      const timeInterval = interval(8 * 60 * 60 * 1000);
      console.log('app update timeInterval', timeInterval);
      timeInterval.subscribe(() => {
        this.updates.checkForUpdate().then(() => console.log('update checked'));
      });
    }
  }

  handleUpdate() {
    this.updates.versionUpdates.pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
      map(evt => ({
        type: 'UPDATE_AVAILABLE',
        current: evt.currentVersion,
        available: evt.latestVersion,
      }))).subscribe(event => {
      console.log('current version is', event.current);
      console.log('available version is', event.available);
      // Check update
      this.updates.activateUpdate().then((res) => {
        /*if (confirm('Mise à jour disponible, merci de l\'installer.')) {
          this.updates.activateUpdate().then(() => location.reload());
        }*/
        alert('Une mise à jour va être installée.');
        if (getEnvironmentLevel() === 'alpha') {
          DB.database.Armageddon();
        } else {
          location.reload();
        }
      });
    });
  }

  ngOnDestroy() {
  }
}
