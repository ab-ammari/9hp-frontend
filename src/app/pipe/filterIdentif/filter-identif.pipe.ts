import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterIdentif'
})
export class FilterIdentifPipe implements PipeTransform {

  transform(tabs: any[], value: string): any[] {
    return (tabs.filter((x:any) => x.name == value));
  }

}
