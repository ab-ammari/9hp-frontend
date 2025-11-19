import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'length'
})
export class LengthPipe implements PipeTransform {

  transform( tabs: any, value: number): number {
    return (tabs.filter((x:any) => x.secteur == value)).length;
  }
}
