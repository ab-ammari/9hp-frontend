import { Pipe, PipeTransform } from '@angular/core';
import {CastorUtilitiesService} from "../services/castor-utilities.service";

@Pipe({
  name: 'contenantContenu'
})
export class ContenantContenuPipe implements PipeTransform {

  constructor(public utils: CastorUtilitiesService) {
  }

  transform(contenant_uuid: string, ...args: unknown[]): string {
    let contenu: string = '';
    const nbMobilier = this.utils.getAllMobilierContenant(contenant_uuid)?.length;
    const nbPrelevement = this.utils.getAllPrelevementContenant(contenant_uuid)?.length;
    const listMateriauxMobilier = this.utils.getAllMateriauxMobilier(this.utils.getAllMobilierContenant(contenant_uuid));
    const listNaturePrelevement = this.utils.getAllNaturesPrelevement(this.utils.getAllPrelevementContenant(contenant_uuid));

    contenu = 'Mobilier (' + nbMobilier + ') :  '
      + listMateriauxMobilier + '; '
      + 'Prelevement (' + nbPrelevement + ') : ' + listNaturePrelevement + ';';
    return contenu;
  }

}
