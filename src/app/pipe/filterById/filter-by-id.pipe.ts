import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterById'
})
export class FilterByIdPipe implements PipeTransform {

  transform(tabs: any[], value: number): any[] {
    return (tabs.filter(x => x.id == value));
  }

}
