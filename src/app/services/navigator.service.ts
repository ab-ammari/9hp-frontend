import {Injectable} from '@angular/core';
import {AbstractService, CoreModule, LOG, LoggerContext, Trigger} from "ngx-wcore";
import {WorkerService} from "./worker.service";
import {
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Params,
  QueryParamsHandling,
  Router,
  RouterEvent
} from "@angular/router";
import {ApiDbTable, ApiSyncableObject, ApiSynchroFrontInterfaceEnum} from "../../../shared";
import {A} from "../Core-event";
import {UI} from "../util/ui";
import {beforeRead} from "@popperjs/core";
import { getTableDescription } from '../DataClasses/models/sync-obj-utilities';
import { debounceTime } from 'rxjs';

const CONTEXT: LoggerContext = {
  origin: 'NavigatorService'
};

@Injectable({
  providedIn: CoreModule
})
export class NavigatorService extends AbstractService {

  constructor(protected w: WorkerService, private router: Router) {
    super(w);
    this.linkTriggers([
      new Trigger(A.requestNavigateTo, (data) => this.navigateTo(data.location, data.queryParams, data.queryParamsHandling)),
      new Trigger(A.requestNavigateToObject, (data) => this.navigateToObject(data.object, data.newTab)),
    ]);

    this.initNavigationSupervisor();
    this.initUIStateSync();
  }

  private initUIStateSync() {
    UI.state.onStoreChange.pipe(
      debounceTime(100)
    ).subscribe(() => {
      const obj_list = Object.entries(UI.state.getStoredStates());
      const queryParams: Params = {};
      
      obj_list.forEach(item => {
        if (item[1]) {
          queryParams[item[0]] = item[1];
        }
      });

      // update URL without navigating
      this.router.navigate([], {
        queryParams: queryParams,
        replaceUrl: true,
        queryParamsHandling: '',
      });
    });
  }

  init(name) {
    console.log(name);
  }

  initNavigationSupervisor() {

    // @ts-ignore
    this.router.events.subscribe((event: RouterEvent) => {

      if (event instanceof NavigationStart) {
        LOG.debug.log({...CONTEXT, action: 'NavigationStart'}, event);
      }

      if (event instanceof NavigationEnd) {
        LOG.debug.log({...CONTEXT, action: 'NavigationEnd'}, event);
        const obj_list = Object.entries(UI.state.getStoredStates());
        const queryParams = {};
        obj_list.forEach(item => {
          if (item[1]) {
            queryParams[item[0]] = item[1];
          }
        });

        this.router.navigate(
          [],
          {
            queryParams: queryParams,
            replaceUrl: true,
            queryParamsHandling: 'merge', // remove to replace all query params by provided
          });
      }
      if (event instanceof NavigationError) {

      }
    });
  }

  navigateTo(location: ApiSynchroFrontInterfaceEnum, params: Params = {},
             paramsHandling: QueryParamsHandling = 'merge', newTab?: boolean) {
    let path = '';
    switch (location) {
      case ApiSynchroFrontInterfaceEnum.INTERFACE_HOME:
        path = 'home';
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_PROFILE:
        path = 'home/profile';
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_LIST:
        paramsHandling = '';
        path = 'home/projects';
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_NEW:
        paramsHandling = '';
        path = 'home/projects/new';
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_CONFIGURATION:
        path = 'home/projects/configuration';
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_EDIT:
        path = 'home/projects/edit';
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_DASH:
        path = 'home/project-dashboard';
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_STATISTICS:
        path = '/home/project-dashboard/statistics';
        break
      case ApiSynchroFrontInterfaceEnum.INTERFACE_SECTOR_LIST:
        path = `home/project-dashboard/${ApiDbTable.secteur}`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_SECTOR_DETAILS:
        path = `home/project-dashboard/${ApiDbTable.secteur}/details`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_SECTOR_NEW:
        path = `home/project-dashboard/${ApiDbTable.secteur}/new`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_ENSEMBLE_LIST:
        path = `home/project-dashboard/${ApiDbTable.ensemble}`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_ENSEMBLE_DETAILS:
        path = `home/project-dashboard/${ApiDbTable.ensemble}/details`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_ENSEMBLE_NEW:
        path = `home/project-dashboard/${ApiDbTable.ensemble}/new`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_FAIT_LIST:
        path = `home/project-dashboard/${ApiDbTable.fait}`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_FAIT_DETAILS:
        path = `home/project-dashboard/${ApiDbTable.fait}/details`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_FAIT_NEW:
        path = `home/project-dashboard/${ApiDbTable.fait}/new`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_US_LIST:
        path = `home/project-dashboard/${ApiDbTable.us}`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_US_DETAILS:
        path = `home/project-dashboard/${ApiDbTable.us}/details`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_US_NEW:
        path = `home/project-dashboard/${ApiDbTable.us}/new`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_MINUTE_LIST:
        path = `home/project-dashboard/${ApiDbTable.document_minute}`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_MINUTE_DETAILS:
        path = `home/project-dashboard/${ApiDbTable.document_minute}/details`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_MINUTE_NEW:
        path = `home/project-dashboard/${ApiDbTable.document_minute}/new`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_SONDAGE_LIST:
        path = `home/project-dashboard/${ApiDbTable.section_sondage}`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_SONDAGE_DETAILS:
        path = `home/project-dashboard/${ApiDbTable.section_sondage}/details`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_SONDAGE_NEW:
        path = `home/project-dashboard/${ApiDbTable.section_sondage}/new`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_MOBILIER_LIST:
        path = `home/project-dashboard/${ApiDbTable.echantillon_mobilier}`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_MOBILIER_DETAILS:
        path = `home/project-dashboard/${ApiDbTable.echantillon_mobilier}/details`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_MOBILIER_NEW:
        path = `home/project-dashboard/${ApiDbTable.echantillon_mobilier}/new`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_PRELEVEMENT_LIST:
        path = `home/project-dashboard/${ApiDbTable.echantillon_prelevement}`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_PRELEVEMENT_DETAILS:
        path = `home/project-dashboard/${ApiDbTable.echantillon_prelevement}/details`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_PRELEVEMENT_NEW:
        path = `home/project-dashboard/${ApiDbTable.echantillon_prelevement}/new`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_CONTENANTS_LIST:
        path = `home/project-dashboard/${ApiDbTable.contenant}`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_CONTENANTS_DETAILS:
        path = `home/project-dashboard/${ApiDbTable.contenant}/details`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_CONTENANTS_NEW:
        path = `home/project-dashboard/${ApiDbTable.contenant}/new`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_PHOTOS_LIST:
        path = `home/project-dashboard/${ApiDbTable.document_photo}`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_PHOTOS_DETAILS:
        path = `home/project-dashboard/${ApiDbTable.document_photo}/details`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_PHOTOS_NEW:
        path = `home/project-dashboard/${ApiDbTable.document_photo}/new`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_TOPOS_LIST:
        path = `home/project-dashboard/${ApiDbTable.topo}`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_TOPOS_DETAILS:
        path = `home/project-dashboard/${ApiDbTable.topo}/details`;
        break;
      case ApiSynchroFrontInterfaceEnum.INTERFACE_TOPOS_NEW:
        path = `home/project-dashboard/${ApiDbTable.topo}/new`;
        break;
      default:
        break;
    }
    LOG.info.log({...CONTEXT}, 'going to : ', path + ' with params ', params);
    if (newTab) {
      const url = this.router.serializeUrl(this.router.createUrlTree([path],
        {queryParams: params}));
      window.open(url, '_blank');
    } else {
      this.router.navigate([path], {queryParams: params, queryParamsHandling: paramsHandling});
    }

  }


  private syncQueryParams() {

  }

  /**
  private navigateToObject(data: ApiSyncableObject, newTab?: boolean) {
    this.w.data().objects.selectObject(data).subscribe(() => {
      this.navigateTo(getObjectDetailsLocation(data.table), {}, 'merge', newTab);
    });
  }
   */

  private navigateToObject(data: ApiSyncableObject, newTab?: boolean) {
    const info = getTableDescription(data.table);
    const uuid_path = info.uuid_paths[0];
    const uuid = data[uuid_path];

    this.w.data().objects.selectObject(data).subscribe(() => {
      const params: Params = {
        [uuid_path]: uuid,
        projet_uuid: UI.state.store.projet_uuid  // Conserver le projet
      };
      this.navigateTo(getObjectDetailsLocation(data.table), params, '', newTab);
    });
  }


}

export function getObjectDetailsLocation(obj: ApiDbTable): ApiSynchroFrontInterfaceEnum {
  switch (obj) {
    case ApiDbTable.document_photo:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_PHOTOS_DETAILS;
    case ApiDbTable.document_minute:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_MINUTE_DETAILS;
    case ApiDbTable.echantillon_mobilier:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_MOBILIER_DETAILS;
    case ApiDbTable.echantillon_prelevement:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_PRELEVEMENT_DETAILS;
    case ApiDbTable.ensemble:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_ENSEMBLE_DETAILS;
    case ApiDbTable.fait:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_FAIT_DETAILS;
    case ApiDbTable.secteur:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_SECTOR_DETAILS;
    case ApiDbTable.section:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_SONDAGE_DETAILS;
    case ApiDbTable.section_sondage:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_SONDAGE_DETAILS;
    case ApiDbTable.section_coupe:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_SONDAGE_DETAILS;
    case ApiDbTable.topo:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_TOPOS_DETAILS;
    case ApiDbTable.us:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_US_DETAILS;
    case ApiDbTable.us_sous_division:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_US_DETAILS;
    case ApiDbTable.us_construite_materiel:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_US_DETAILS;
    case ApiDbTable.us_bati:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_US_DETAILS;
    case ApiDbTable.us_construite:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_US_DETAILS;
    case ApiDbTable.us_negative:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_US_DETAILS;
    case ApiDbTable.us_positive:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_US_DETAILS;
    case ApiDbTable.us_squelette:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_US_DETAILS;
    case ApiDbTable.us_technique:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_US_DETAILS;
    case ApiDbTable.contenant:
      return ApiSynchroFrontInterfaceEnum.INTERFACE_CONTENANTS_DETAILS;
    default:
      return null;
  }
}
