import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByUniteAndSondageId'
})
export class FilterByUniteAndSondageIdPipe implements PipeTransform {

  transform(tabs: any[], uniteId: number, sondageId: number): any[] {
    return (tabs.filter(x => (x.sondage_id == sondageId) && (x.unite_id == uniteId)));
  }

}
