import {LOG} from './logger';
import {defer, from, Observable} from "rxjs";


export class WUtils {

  static deepCopy<T>(x: T): T {
    return x ? JSON.parse(JSON.stringify(x)) : null;
  }

  static cleanAllStorageExceptFor(keep: Array<string>): void {
    const cache: Array<Array<string>> = [];
    for (const item of keep) {
      cache.push([item, localStorage.getItem(item)]);
    }
    localStorage.clear();
    for (const item of cache) {
      if (item[1]) {
        localStorage.setItem(item[0], item[1]);
      }
    }
  }

  static getStorageItem(key: string, deleteafter: boolean = false): unknown {
    let item = null;
    try {
      item = JSON.parse(localStorage.getItem(key));
      if (deleteafter) {
        localStorage.removeItem(key);
      }
    } catch (err) {
      LOG.error.log(err, key, item);
      localStorage.removeItem(key);
      item = null;
    }

    if (item && Object.keys(item).length === 0) {
      item = null;
    }
    return item;
  }

  static setStorageItem(key: string, item: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (err) {
      LOG.error.log(key, err, item);
    }
  }

  static observePromise<T>(promise: Promise<T>): Observable<T> {
    return defer(() => from(promise));
  }

}

