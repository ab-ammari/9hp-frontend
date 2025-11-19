import {Pipe, PipeTransform} from '@angular/core';
import {validate} from "uuid";
import {CastorUtilitiesService} from "../services/castor-utilities.service";

@Pipe({
  name: 'sectorSynthese'
})
export class SectorSynthesePipe implements PipeTransform {
  constructor(public utils: CastorUtilitiesService) {
  }

  transform(secteur_uuid: string, ...args: unknown[]): string {
    let countFaitOfsector: number = 0;
    let countUSOfSector: number = 0;
    let countEnsembleOfSector: number = 0;
    let countSondageOfSector: number = 0;
    let countMinuteOfSector: number = 0;
    let countPhotosOfSector: number = 0;
    let countTopoOfSector: number = 0;

    if (validate(secteur_uuid)) {

      countFaitOfsector = this.utils.getAllSectorFaits(secteur_uuid)?.length ?? 0;
      countUSOfSector = this.utils.getAllSectorUS(secteur_uuid)?.length ?? 0;
      countEnsembleOfSector = this.utils.getAllSectorEnsemble(secteur_uuid)?.length ?? 0;
      countSondageOfSector = this.utils.getAllSectorSondages(secteur_uuid)?.length ?? 0;
      // countMinuteOfSector = this.utils.getAllSectorMinutes(secteur_uuid)?.length ?? 0;
      // countPhotosOfSector = this.utils.getAllSectorPhotos(secteur_uuid)?.length ?? 0;


      return countFaitOfsector + ' faits ; '
        + countUSOfSector + ' US ; '
        + countEnsembleOfSector + ' ensembles ; '
        + countSondageOfSector + ' sondages ; ';
        // + countMinuteOfSector + ' minutes; '
        // + countPhotosOfSector + ' photos;';
    }
    return null;
  }

}
