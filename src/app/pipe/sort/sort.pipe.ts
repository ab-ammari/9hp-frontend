import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sort'
})
export class SortPipe implements PipeTransform {

  transform(tab: any[]) : any[] {
    return tab.sort();
  }

}
