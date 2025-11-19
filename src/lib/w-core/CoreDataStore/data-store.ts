import {WCustomBehaviourSubject} from './oxy-core-behaviour-subject';
import {Observable} from 'rxjs';


export class DataStore<T> {


  /// Data Variables go here ->
  // tslint:disable-next-line:variable-name
  private _data: WCustomBehaviourSubject<T>;

  get data() {
    return this._data.value;
  }

  set data(val: any) {
    this._data.value = val;
  }

  constructor(dataStoreObject: T) {
    this._data = new WCustomBehaviourSubject<T>(dataStoreObject);
  }

  observe(): Observable<any> {
    return this._data.observe;
  }


}
