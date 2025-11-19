import {ApiUser} from "../../../../shared";
import {debounce, filter} from "rxjs/operators";
import {observe, triggerChangeDetection} from "../../util/utils";
import {DB, dbStatus} from "../../Database/DB";
import {Table} from "dexie";
import {BehaviorSubject, Observable, timer} from "rxjs";
import {LOG, LoggerContext} from "ngx-wcore";

const CONTEXT: LoggerContext = {
  origin: 'UserSession'
}

export class UserSession {

  get user(): ApiUser {
    return this._user.value;
  }

  set user(user: ApiUser) {
    if (user) {
      observe(this.user_table.put(user)).subscribe(() => {
        this.current_user = user?.user_uuid;
        this.syncUser();
      });
    } else {
      this.current_user = null;
      this.syncUser();
    }

  }

  private current_user: string; // user_uuid

  private _user: BehaviorSubject<ApiUser> = new BehaviorSubject<ApiUser>(null);
  private _ready: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  get onUserUpdated() {
    return this._user.asObservable();
  }

  get readyState(): BehaviorSubject<boolean> {
    return this._ready;
  }

  constructor(private user_table: Table<ApiUser>) {
    this._user.pipe(
      debounce(() => timer(100)),).subscribe(() => triggerChangeDetection());
    this.current_user = localStorage.getItem('user_uuid');
    if (DB.database.isReady) {
      this.syncUser();
    }
    DB.database.status.pipe(filter(x => x === dbStatus.ready)).subscribe(() => {
      this.syncUser();
    });
  }

  private syncUser(): Observable<ApiUser> {
    this.current_user = this.current_user ?? '';
    const sub = observe(this.user_table.get(this.current_user));
    sub.subscribe(user => {
      LOG.debug.log({...CONTEXT, action: 'readyState', message: 'Syncing new user'}, this.current_user, user, this._user.value);
      if (user) {
        if (user !== this._user.value) {
          this._user.next(user);
          this.current_user = user.user_uuid;
          localStorage.setItem('user_uuid', user.user_uuid);
        }
      } else {
        this._user.next(null);
        this.current_user = null;
        localStorage.removeItem('user_uuid');
      }

      if (!this._ready.value) {
        this._ready.next(true);
        LOG.debug.log({...CONTEXT, action: 'readyState', message: 'User session has been loaded.'}, this._user.value, this.current_user, user);
      }
    });
    return sub;
  }
}
