import { Pipe, PipeTransform } from '@angular/core';
import {WorkerService} from "../services/worker.service";
import {validate} from "uuid";

@Pipe({
  name: 'apiSondage'
})
export class ApiSondagePipe implements PipeTransform {
  constructor(public w: WorkerService) {
  }

  transform(value: string, ...args: unknown[]): unknown {
    if (validate(value) && this.w.data().objects.section.all.list.length > 0) {
      const section = this.w.data().objects.section.all.list.find(section => section.item.section_uuid === value).item;
      if (section) {
        return section.tag ?? section.section_uuid;
      }
    }
    return null;
  }

}
