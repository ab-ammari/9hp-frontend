import {LOG, LoggerContext, WUtils} from "ngx-wcore";
import {BehaviorSubject, Observable, timer} from "rxjs";
import {triggerChangeDetection} from "./utils";
import {debounce, tap} from "rxjs/operators";

const CONTEXT: LoggerContext = {
  origin: 'UI-store'
}

const ui_store_ID: string = 'ui_stored_selections';

class UIStore {
  user_uuid?: string = null;
  projet_uuid?: string = null;
  secteur_uuid?: string = null;
  contenant_uuid?: string = null;
  document_uuid?: string = null;
  echantillon_uuid?: string = null;
  ensemble_uuid?: string = null;
  fait_uuid?: string = null;
  gps_uuid?: string = null;
  mouvement_uuid?: string = null;
  phase_uuid?: string = null;
  section_uuid?: string = null;
  stratigraphie_uuid?: string = null;
  topo_uuid?: string = null;
  us_uuid?: string = null;

  constructor() {
  }
}

export class UI {
  static state: UI = new UI();
  private _store: BehaviorSubject<UIStore> = new BehaviorSubject<UIStore>(new UIStore()); // !! Should never be NULL !

  admin_tools_visible: boolean = false;

  public get store(): UIStore {
    return this._store?.value;
  }

  public get onStoreChange(): Observable<UIStore> {
    return this._store?.asObservable();
  }

  constructor() {
    this._store.pipe(
      debounce(() => timer(100)),
      tap(() => {
        triggerChangeDetection();
      })).subscribe();
    this.initStore();
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.storageArea === localStorage && event.key === ui_store_ID) {
        LOG.debug.log({...CONTEXT, action: 'window.addEventListener(\'storage\''}, this.store);
        this.initStore();
      }
    }, false);
  }

  private getQueryParams = (params, url: string) => {

    const href = url;
    //this expression is to get the query strings
    const reg = new RegExp('[?&]' + params + '=([^&#]*)', 'i');
    const queryString = reg.exec(href);
    return queryString ? queryString[1] : null;
  };

  getStoredStates(): UIStore {
    return this.store;
  }

  getState(path: string): string {
    return this.store[path];
  }

  setState(path: string, uuid: string) {
    //LOG.debug.log({...CONTEXT, action: 'setState'}, path, uuid);
    const newStore = this.store;
    newStore[path] = uuid;
    this._store.next(newStore);
    this.saveStore();
  }

  resetStore() {
    localStorage.removeItem(ui_store_ID);
    localStorage.removeItem('user_uuid');
    this._store.next({});
  }

  private initStore() {
    const url: string = window.location.href;
    const obj_list = Object.entries(this.store);
    const local_store = (WUtils.getStorageItem(ui_store_ID) as UIStore) ?? {};
    this._store.next(local_store);
    //LOG.debug.log({...CONTEXT, action: 'saved Local Store'}, this.store);
    obj_list.forEach(item => {
      const val = this.getQueryParams(item[0], url);
      if (val) {
        this.store[item[0]] = val;
      }
    });
    //LOG.debug.log({...CONTEXT, action: 'store with QueryParam'}, this.store);
    if (!this.store) {
      this._store.next({});
    }
    if (this._store.value !== local_store) {
      this.saveStore();
    }

  }

  private saveStore(store: UIStore = this.store) {
    LOG.debug.log({...CONTEXT, action: 'saveStore'}, this.store);
    WUtils.setStorageItem(ui_store_ID, store);
  }
}


