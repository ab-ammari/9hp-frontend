import {BehaviorSubject, Observable} from 'rxjs';
import {share} from 'rxjs/operators';

export class WCustomBehaviourSubject<T> {

  // tslint:disable-next-line:variable-name
  private _data: BehaviorSubject<T>;

  public get value(): T {
    return this._data.value;
  }

  public set value(a: T) {
    this._data.next(a);
  }

  public get observe(): Observable<T> {
    return this._data.asObservable();
  }

  constructor(initialValue: T) {
    this._data = new BehaviorSubject<T>(initialValue);
    this._data.pipe(share());
  }
}



