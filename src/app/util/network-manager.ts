import {LOG, LoggerContext, RestApi} from "ngx-wcore";
import {DEV} from "./dev";
import {BehaviorSubject, first, Observable} from "rxjs";
import {ApiLoginRequest} from "../../../shared/objects/models/enums/ApiLoginRequest";
import {LoginActions} from "../../../shared/actions/login-actions";
import {share, tap, timeout} from "rxjs/operators";
import {ApiLoginReply} from "../../../shared/objects/models/enums/ApiLoginReply";
import {ApiIQ} from "wcore-shared";
import {triggerChangeDetection} from "./utils";

const CONTEXT: LoggerContext = {
  origin: 'NetworkManager'
}

class NetMan {
  static net_man = new NetMan();

  get status(): boolean {
    return this.net_status.value;
  }

  get status_observer(): Observable<boolean> {
    return this.net_status.asObservable();
  }

  private net_status: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private api: RestApi;

  private pingLoop_id: string | number | NodeJS.Timeout;
  private lastPing: number = 0;
  private pingIsRunning: boolean = false;

  constructor() {
    this.net_status.subscribe(() => triggerChangeDetection());
    window.addEventListener('online', () => {
      LOG.info.log({...CONTEXT, action: 'Became online'});
      this.ping();
    });
    window.addEventListener('offline', () => {
      LOG.info.log({...CONTEXT, action: 'Became offline'});
      this.ping();
    });
    this.setApi();
    this.ping();
  }

  pingLoop() {
    if ((Date.now() - this.lastPing) > 300000) {// if no ping for 5 minutes reset interval
      clearInterval(this.pingLoop_id);
      this.pingLoop_id = null;
    }
    if (!this.pingLoop_id) {
      this.pingLoop_id = setInterval(() => {
        this.ping();
      }, 10000); // at least one ping per 10 sec
    }
  }

  setApi() {
    if (DEV.tools.api_url) {
      this.api = new RestApi(DEV.tools.api_url + '/');
    } else {
      this.api = null;
    }
  }


  ping() {
    this.pingLoop();
    if (((Date.now() - this.lastPing) > 10000) && !this.pingIsRunning) { // only ping if no ping in last 10 seconds and not already running
      if (this.api && this.api.isOnline()) {
        this.lastPing = Date.now();
        this.pingIsRunning = true;
        const sub = this.api.get('ping').pipe(
          timeout(30000),
          first()
        ).subscribe({
          next: (payload: ApiVersion) => {
            this.net_status.next(payload.running);
            this.pingIsRunning = false;
          },
          error: (err: Error) => {
            this.net_status.next(false);
            sub.unsubscribe();
            this.pingIsRunning = false;
          }
        });
      } else {
        this.net_status.next(false);
      }
    }

  }

  login(token: string): Observable<ApiIQ<ApiLoginRequest, ApiLoginReply>> {
    const apiLoginRequest: ApiLoginRequest = {token};
    return this.api.post({event: LoginActions.LOGIN_START.name(), request: apiLoginRequest})
      .pipe(
        tap((value: any) => {
          LOG.debug.log('LOGIN CALL NEXT :: ', value);
        }), share());
  }
}

export const NetworkManager = NetMan.net_man;

interface ApiVersion {
  NODE_CRON: boolean;
  NODE_FILE: string;
  NODE_MODE: string;
  NODE_REDIS: true
  NODE_SERVEUR: string;
  NODE_WORKER: string;
  date: Date;
  image: string;
  running: boolean;
  serveur: string;
  version: string;
}
