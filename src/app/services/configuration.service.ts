import {Injectable, NgZone} from '@angular/core';
import {WorkerService} from "./worker.service";
import {LOG, LoggerContext, networkMode, NetworkStatus, SystemActions} from "ngx-wcore";
import {DEV} from "../util/dev";
import {NetworkManager} from "../util/network-manager";
import {filter, takeUntil, tap} from "rxjs/operators";
import {DB, dbStatus} from "../Database/DB";
import {Observable} from "rxjs";
import {ApiIQ} from "wcore-shared";
import {ApiLoginRequest} from "../../../shared/objects/models/enums/ApiLoginRequest";
import {ApiLoginReply} from "../../../shared/objects/models/enums/ApiLoginReply";

const CONTEXT: LoggerContext = {
  origin: 'ConfigurationService'
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  get isDevMode(): boolean {
    return this._isDevMode;
  }

  set isDevMode(mode: boolean) {
    this.zone.run(() => {
      this._isDevMode = mode;
    });
  }

  private _isDevMode: boolean;

  constructor(private w: WorkerService, private zone: NgZone) {

    DEV.tools.observeDevMode.pipe(tap((value) => {
      this.isDevMode = value;
    })).subscribe();
    this.isDevMode = DEV.tools.isDevMode;

    DB.database.status.pipe(
      filter(status => status === dbStatus.ready),
      tap(() => {
        DB.database.user_session.onUserUpdated.pipe(
          takeUntil(DB.database.status.pipe(filter(status => status !== dbStatus.ready))),
          tap(() => {
            this.initNetwork(localStorage.getItem('user_token'));
          })
        ).subscribe();
      })
    ).subscribe();

  }


  initBackend(sub): Observable<ApiIQ<ApiLoginRequest, ApiLoginReply>> {
    localStorage.setItem('user_token', sub);
    let subscriber = NetworkManager.login(sub).pipe(tap((value) => {
      if (value?.payload?.user?.user_uuid) {
        DB.database.user_session.user = value.payload.user;
        LOG.debug.log('initBackend success :: ', value);
      } else {
        LOG.debug.log({...CONTEXT, action: 'initBackend', message: 'unable to init backend...'}, value);
        // no user or error ????
      }
    }));
    subscriber.subscribe();
    return subscriber;
  }

  initNetwork(token: string) {
    if (token) {
      if (this.w.networkConfig.apikey !== token && this.w.networkStatus.socket !== NetworkStatus.online) {
        LOG.debug.log({...CONTEXT, action: 'initNetwork'}, token);
        this.w.trigger(SystemActions.initRemote, {
          url: DEV.tools.api_url + '/',
          apikey: token,
          mode: new Set<networkMode>(['rest']),
          preferredMode: 'rest'
        });
      } else {
        LOG.debug.log({
          ...CONTEXT,
          action: 'initNetwork',
          message: 'don\'t init because already setup'
        }, [token, this.w.networkConfig, this.w.networkStatus]);
      }
    } else {
      LOG.warn.log({...CONTEXT, action: 'initNetwork', message: 'No token found !!!'}, token);
    }

  }


}
