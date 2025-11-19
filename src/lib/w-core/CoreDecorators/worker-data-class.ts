import {DataStore} from '../CoreDataStore/data-store';

export function WorkerDataClass<T>(dataClass: T) {
  // tslint:disable-next-line:ban-types
  return (constructor: Function) => {
    console.log('-- decorator invoked --');
    constructor.prototype.dataStore = new DataStore<T>(dataClass);
    constructor.prototype.data = (): T => constructor.prototype.dataStore.data;
  };
}
