import {Injector} from '@angular/core';
import {CoreServiceobject} from './core-service-object';

import {AbstractService} from '../CoreServices/abstract.service';
import {service_list} from '../CoreServices/w-core.service';


export class WCoreConfig<X, Y> {
  private serviceList: { [key: string]: any } = [];

  public services: {
    [key: string]: CoreServiceobject<AbstractService>, // the Objects of the service that OxyCore needs to Manage
  } = {};

  constructor(private injector: Injector, customServices: service_list<X, Y>) {

    for (const item of customServices) {
      this.serviceList[item.name] = item.service;
    }


    for (const item of Object.entries(this.serviceList)) {
      this.services[item[0]] = new CoreServiceobject(item[1], this.injector);
    }

  }


  private list() {
    const obj = [];
    for (const item of Object.entries(this.serviceList)) {
      obj.push(item[0]);
    }
    return obj;
  }


}

