import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByIdEns'
})
export class FilterByIdEnsPipe implements PipeTransform {

  transform(tabs: any[], value: number): any[] {
    return (tabs.filter(x => x == value));
  }

}
