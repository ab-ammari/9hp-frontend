import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(tabs: any[], value: number): any[] {
    return (tabs.filter((x:any) => x.secteur == value));
  }
}
