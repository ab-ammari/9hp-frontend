import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterLink'
})
export class FilterLinkPipe implements PipeTransform {

  transform(tabs: any[], values: any[]): any[] {
    return tabs.filter(v => values.indexOf(v) === -1);
  }

}
