import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortBy1Field'
})
export class SortBy1FieldPipe implements PipeTransform {

  transform(tab: any[], field: string) : any[] {
    return tab.sort((a: any, b: any) => a[field] > b[field] ? 1 : a[field] === b[field] ? 0 : -1);
  }
}
