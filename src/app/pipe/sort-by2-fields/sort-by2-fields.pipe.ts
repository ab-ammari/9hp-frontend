import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortBy2Fields'
})
export class SortBy2FieldsPipe implements PipeTransform {

  transform(tab: any[], fieldA: string, fieldB: string) : any[] {
    return tab.sort((a: any, b: any) => {
      if (a[fieldA] === b[fieldA]) {
        return a[fieldB] - b[fieldB];
      }
      return a[fieldA] > b[fieldA] ? 1 : -1;
    });
  }
}
