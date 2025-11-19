import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'startsWith'
})
export class StartsWithPipe implements PipeTransform {

  transform(value: any, arg: string): boolean {
    if(value != null) {
      const valueStr = value.toString();
      return valueStr.startsWith(arg);
    } else {
      return true; //pour afficher le champ vide
    }
  }

}
