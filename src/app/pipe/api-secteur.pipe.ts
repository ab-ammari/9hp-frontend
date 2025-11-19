import { Pipe, PipeTransform } from '@angular/core';
import {validate} from "uuid";
import {WorkerService} from "../services/worker.service";
import {ApiSecteur} from "../../../shared";

@Pipe({
  name: 'apiSecteur'
})
export class ApiSecteurPipe implements PipeTransform {
  constructor(public w: WorkerService) {
  }

  transform(value: string, ...args: unknown[]): unknown {
    if (validate(value) && this.w.data().objects.secteur.all.list.length > 0) {
      const secteur: ApiSecteur = this.w.data().objects.secteur.all.list.find(sector => sector.item.secteur_uuid === value).item;
      if (secteur) {
        return secteur.tag ?? secteur.secteur_uuid;
      }
    }
    return null;
  }

}
