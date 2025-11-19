import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByUniteAndMinuteId'
})
export class FilterByUniteAndMinuteIdPipe implements PipeTransform {

  transform(tabs: any[], uniteId: number, minuteId: number): any[] {
    return (tabs.filter(x => (x.minute_id == minuteId) && (x.unite_id == uniteId)));
  }

}
