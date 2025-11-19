import { Pipe, PipeTransform } from '@angular/core';
import {ApiFait, ApiUs, ApiUser} from "../../../shared";
import {WorkerService} from "../services/worker.service";
import {validate} from "uuid";
import {LOG, LoggerContext} from "ngx-wcore";

const CONTEXT: LoggerContext = {
  origin: 'ApiUSPipe'
}
@Pipe({
  name: 'apiUS'
})
export class ApiUSPipe implements PipeTransform {
  constructor(public w: WorkerService) {
  }
  transform(value: string, usFait?: boolean, ...args: unknown[]): string {
    if (validate(value) && this.w.data().objects.us.all.list.length > 0) {
      const us: ApiUs = this.w.data().objects.us.all.findByUuid(value)?.item;
      if (us && !usFait) {
       /// LOG.debug.log({...CONTEXT, action: 'transform', message: 'return us_uuid'}, us);
        return us.tag ?? us.us_uuid;
      } else if (us && usFait) {
       /// LOG.debug.log({...CONTEXT, action: 'transform', message: 'return fait_uuid'}, us);
        return us.fait_uuid;
      }
    }
    return null;
  }

}
