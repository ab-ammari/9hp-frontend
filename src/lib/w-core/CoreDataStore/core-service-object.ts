import {Injector, Type} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

export class CoreServiceobject<T> {

  private readonly ServiceObject: Type<T>;
  // tslint:disable-next-line:variable-name
  private _ready: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public get ready(): Observable<boolean> {
    return this._ready.asObservable();
  }

  // tslint:disable-next-line:variable-name
  private _service: T;
  public get service(): T {
    if (!this._service) {
      this._service = this.injector.get(this.ServiceObject);
      this._ready.next(true);
    }
    return this._service;
  }

  constructor(token: Type<T>, private injector: Injector) {
    this.ServiceObject = token;
  }
}
