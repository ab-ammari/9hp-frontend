import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'search'
})
export class SearchPipe implements PipeTransform {

  transform(tabs: any[], value: any): any[] {
    if (value == '') {
      return tabs;
    } else {
      // Ok, ne prends pas en compte les accents
      const res = tabs.filter((x:any) => (x.numero.toString().toUpperCase().includes(value.toUpperCase()) ||
                                          x.numprov.toUpperCase().includes(value.toUpperCase()) ||
                                          x.genre.toUpperCase().includes(value.toUpperCase()) ||
                                          x.identification.toUpperCase().includes(value.toUpperCase()) ||
                                          x.mobilier.toUpperCase().includes(value.toUpperCase()) ||
                                          x.datation.toUpperCase().includes(value.toUpperCase())));
      if (res.length > 0) {
        return res;
      } else {
          return [null];
      }
    }
  }

}
