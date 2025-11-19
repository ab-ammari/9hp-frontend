import {Injectable, NgZone} from '@angular/core';
import {DB, dbStatus} from "../Database/DB";
import {filter, takeUntil, tap} from "rxjs/operators";
import {UI} from "../util/ui";
import {LOG, LoggerContext, SystemActions, WUtils} from "ngx-wcore";
import {NetworkManager} from "../util/network-manager";
import {WorkerService} from "./worker.service";
import {UserService} from "./user.service";
import {Subject} from "rxjs";
import {A} from "../Core-event";
import {ToastService} from "./toast.service";

const CONTEXT: LoggerContext = {
  origin: 'ZoneSyncService'
}

@Injectable({
  providedIn: 'root'
})
export class ZoneSyncService {

  private $onDBReady: Subject<unknown> = new Subject<unknown>();

  constructor(
    private w: WorkerService,
    private zone: NgZone,
    private userService: UserService,
    private toast: ToastService
  ) {
    this.setup();
    this.$onDBReady.pipe(
      tap(() => {
        this.onDBReady();
      })
    ).subscribe();
    document.addEventListener('RequestToast', (event: CustomEvent) => {
      LOG.debug.log('RequestToast', event);
      this.toast.info(event.detail.title, event.detail.content);
    }, false);
  }

  init() {
    //force init the service
  }

  private setup() {
    // NETWORK
    this.w.on(SystemActions.NETWORK_ERROR).pipe(
      tap(() => {
        NetworkManager.ping();
      })
    ).subscribe();

    /// DATABASE
    DB.database.status.pipe(
      filter(value => value === dbStatus.ready),
      tap(() => {
        this.$onDBReady.next(undefined);
      })).subscribe();
    if (DB.database.isReady) {
      this.$onDBReady.next(undefined);
    }
    /// NETWORK
    NetworkManager.status_observer.pipe(
      tap(value => {
        this.onNetworkUpdate(value);
      })
    ).subscribe();
    this.onNetworkUpdate(NetworkManager.status);
  }


  private onDBReady() {
    //Project INDEX
    DB.database.project_index.onIndexUpdate.pipe(
      takeUntil(this.$onDBReady),
      tap(value => {
        this.zone.run(() => {
          this.w.data().project_index = value;
        });
      })
    ).subscribe();
    this.zone.run(() => {
      this.w.data().project_index = DB.database.project_index.index;
    });

    // USER
    DB.database.user_session.onUserUpdated.pipe(
      takeUntil(this.$onDBReady)
    ).subscribe(next => {
      if (next) {
        this.w.data().user = WUtils.deepCopy(DB.database.user_session.user);
       // this.toast.info('User Updated', '');
      }
    });
    DB.database.user_session.readyState.pipe(
      takeUntil(this.$onDBReady),
      filter(value => value), // we are only interested in True
      tap(value => {
        this.onUserReady();
        this.toast.info('User Ready', '');
      })
    ).subscribe();
    if (DB.database.user_session.readyState.value) {
      this.w.data().user = WUtils.deepCopy(DB.database.user_session.user);
    }
    this.w.trigger(A.DBisReady);


  }

  private onUserReady() {
    if (!UI.state.store.us_uuid || !this.w.data().user) { // only if no user already provided
      LOG.debug.log({...CONTEXT, action: 'onUserReady', message: 'No User, attempting Auth ?'}, UI.state.store.us_uuid, this.w.data().user);
      this.zone.run(() => {
        this.userService.authUser();
      });
    } else {
      LOG.debug.log({...CONTEXT, action: 'onUserReady', message: 'User already loaded. no need for Auth'}, UI.state.store.us_uuid, this.w.data().user);
    }
  }

  private onNetworkUpdate(status: boolean) {
    this.zone.run(() => {
      this.w.data().status.online = status;
      document.title = this.w.data().status.online ? 'Castor - online' : 'castor - offline';
      if ((!UI.state.store.us_uuid || !this.w.data().user) && DB.database?.user_session?.readyState?.value) {
        this.onUserReady();
      }
      // this.toast.info(status ? 'online' : 'offline', '');
    })
  }

}
