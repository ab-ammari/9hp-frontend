import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterBySondageId'
})
export class FilterBySondageIdPipe implements PipeTransform {

  transform(tabs: any[], value: number): any[] {
    return (tabs.filter(x => x.sondage_id == value));
  }

}
