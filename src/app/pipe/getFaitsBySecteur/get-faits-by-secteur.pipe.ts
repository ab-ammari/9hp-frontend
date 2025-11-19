import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getFaitsBySecteur'
})
export class GetFaitsBySecteurPipe implements PipeTransform {

  transform(value: number, tabs: any): number {
    return (tabs.filter((x:any) => x.secteur == value)).length;
  }
}
