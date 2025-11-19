import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dimensionPipe'
})
export class DimensionPipePipe implements PipeTransform {

  transform(value: number, mode: 'classic' | 'surface' | 'volume' = 'classic', ...args: unknown[]): string {
    if (value) {
      switch (mode) {
        case "classic":
          return (value / 1000).toString();
        case "surface":
          return (value / Math.pow(10, 6)).toString();
        case "volume":
          return (value / Math.pow(10, 9)).toString();
        default:
          return '';
      }
    } else {
      return '';
    }
  }

}
