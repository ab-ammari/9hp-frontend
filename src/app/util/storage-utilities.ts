import {LOG, LoggerContext} from "../../lib/w-core/utils/logger";
import {BehaviorSubject, Subject} from "rxjs";
import {Store} from "@felixkletti/managementjs";
import {debounceTime, takeUntil, tap} from "rxjs/operators";
import {ApiSyncableObject} from "../../../shared";

const CONTEXT: LoggerContext = {
  origin: 'storage-utilities'
};

const STORAGE_DEBUG_ENABLED = false;
function debugLog(action: string, ...payload: unknown[]): void {
  if (!STORAGE_DEBUG_ENABLED) {
    return;
  }
  LOG.debug.log({...CONTEXT, action}, ...payload);
}

/**
 * A class representing a key-value store in local storage.
 *
 * @template TEMPLATE - The type of the value stored in the key-value store.
 */
export class LS<TEMPLATE> {
  constructor(
    private key: string,
    private default_value?: TEMPLATE,
  ) {

  }
  /**
   * Retrieves the stored data from the local storage based on the specified key.
   *
   * @returns The stored data as a TEMPLATE object if it exists, otherwise undefined.
   */
  get(): TEMPLATE | undefined {
    try {
      const data = localStorage.getItem(this.key);
      if (data) {
        return JSON.parse(data) as TEMPLATE;
      } else if (this.default_value) {
        this.set(this.default_value);
        return this.default_value;
      } else {
        return undefined;
      }
    } catch (e) {
      LOG.error.log({...CONTEXT, action: 'LS', message: 'get() Couldnt get or parse'}, this.key, this.default_value, e);
      return undefined;
    }
  }

  /**
   * Set the value in localStorage using the provided key.
   *
   * @param {TEMPLATE} value - The value to be stored in localStorage.
   * @return {void}
   */
  set(value: TEMPLATE): void {
    let value_string: string;
    try {
      value_string = JSON.stringify(value);
    } catch (e) {
      LOG.error.log({...CONTEXT, action: 'LS', message: 'Couldnt stringify'}, e, value, this.key);
      return;
    }
    try {
      localStorage.setItem(this.key, value_string);
    } catch (e) {
      LOG.error.log({...CONTEXT, action: 'LS', message: 'Couldnt save value'}, e, value, value_string, this.key);
    }
  }

  /**
   * Clears the value stored in the localStorage for the given key.
   *
   * @returns {void}
   */
  clear(): void {
    localStorage.removeItem(this.key);
  }
}

/**
 * Creates a deep copy of the given object.
 *
 * @param {T} obj - The object to be copied.
 * @return {T} - The deep copy of the object.
 * @throws {Error} - If the object's type is not supported.
 */
export function deepCopy<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    const arrCopy = [] as unknown[];
    obj.forEach((v, i) => (arrCopy[i] = deepCopy(v)));
    return arrCopy as T;
  }

  if (obj instanceof Object) {
    const objCopy = {} as { [key: string]: unknown };
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        objCopy[key] = deepCopy(obj[key]);
      }
    }
    return objCopy as T;
  }

  if (obj instanceof Map) {
    return new Map(Array.from(obj, ([key, val]) => [key, deepCopy(val)])) as T;
  }

  if (obj instanceof Set) {
    return new Set(Array.from(obj, item => deepCopy(item))) as T;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}


export class StorageStore<VALUE> extends Store{
  value: VALUE;
  constructor() {
    super();
  }
}


export class SyncedStorage<VALUE extends ApiSyncableObject> {

  private readonly destroyer$ = new Subject<void>();
  private readonly _value_subject: BehaviorSubject<StorageStore<VALUE>> = new BehaviorSubject(new StorageStore<VALUE>());

  get value(): VALUE {
  //  LOG.debug.log({...CONTEXT, action: 'get value()'}, this, this._value, this._value?.value);
    return this._value_subject.value.value;
  }
  set value(value: VALUE) {
    const store = this.updateStore(value);
    this._value_subject.next(store);
    if (store.value) {
      this.STORAGE.set(store.value);
    }
  }
  private updateStore(value: VALUE): StorageStore<VALUE> {
    const store: StorageStore<VALUE> = new StorageStore();
    store.value = value;
    this.destroyer$.next();
    store.observable().pipe(
      takeUntil(this.destroyer$),
      debounceTime(0),
      tap((update) => {
        this._value_subject.next(store);
        if (this.value) {
          this.STORAGE.set(this.value);
        }
      })
    ).subscribe();
    return store;
  }
  private get STORAGE(): LS<VALUE> {
    return new LS<VALUE>(this.trackBy(this.value));
  }
  private readonly listener = (event: StorageEvent) => {
    if (event.storageArea === localStorage && event.key === this.trackBy(this.value)) {
      const store = this.updateStore(this.STORAGE.get());
      this._value_subject.next(store);
    }
  };

  private readonly trackBy: (v: VALUE) => string | undefined;

  constructor(trackBy: (v: VALUE) => string) {
    this.trackBy = (value: VALUE) => (value ? trackBy(value) : undefined);
     window.addEventListener(
      "storage",
       this.listener,
      false,
    );
  }

  destroy() {
    window.removeEventListener("storage", this.listener);
    this.destroyer$.next();
    // clear storage of expired items
    for (let index = 0; index < localStorage.length; index++ ) {
      const key = localStorage.key(index);
      const s = localStorage.getItem(key);
      if (s.includes('timestamp')) {
        try {
          const value = JSON.parse(s);
          if (value?.timestamp < (Date.now() - (24 * 60 * 60 * 1000))) {
            localStorage.removeItem(key);
          }
        } catch (e) {}
      }
    }
  }
  private init(value: VALUE) {
    this.value = new LS<VALUE>(this.trackBy(value)).get();
  }
  static init<VALUE extends ApiSyncableObject>(trackBy: (v: VALUE) => string) {
    return SyncedStorage.negociate(null, null, trackBy);
  }
  static negociate<VALUE extends ApiSyncableObject>(value: VALUE, storage: SyncedStorage<VALUE>, trackBy: (v: VALUE) => string): SyncedStorage<VALUE> | undefined {
    debugLog('negociate', value, storage, trackBy);
    if (value) {
      if (storage) {
        debugLog('negociate:update', storage);
        return storage.update(value);
      } else {
        const storage = new SyncedStorage(trackBy);
        debugLog('negociate:create', storage, value);
        storage.update(value);
        return storage;
      }
    } else {
      if (storage) {
        storage.destroy();
      }
      return undefined;
    }
  }

  update(value: VALUE): SyncedStorage<VALUE> | undefined {
    debugLog('update', value, this);
    if (!value) {
      if (this) {
        this.destroy();
        return undefined;
      } else {
        // all good
        return undefined;
      }
    } else {
      if (!this.value) {
        debugLog('initial setter', value, this.value);
        this.init(value);
      }
      debugLog('check version', value?.created, this.value?.created);
      if (this.value?.created >= value.created) {
        // ignore. is same or older version.
      } else {
        this.value = value;
      }
      return this;
    }
  }

}

