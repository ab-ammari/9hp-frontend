import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByUniteId'
})
export class FilterByUniteIdPipe implements PipeTransform {

  transform(tabs: any[], value: number): any[] {
    return (tabs.filter(x => x.id == value));
  }

}
