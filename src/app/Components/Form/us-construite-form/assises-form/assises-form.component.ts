import {Component, Input} from '@angular/core';
import {ApiTypeCategory, ApiUsConstruite} from "../../../../../../shared";

@Component({
  selector: 'app-assises-form',
  templateUrl: './assises-form.component.html',
  styleUrls: ['./assises-form.component.scss']
})
export class AssisesFormComponent {

  @Input() us: ApiUsConstruite;

  protected readonly ApiTypeCategory = ApiTypeCategory;

  calcMoyenne() {
    if (this.us.us_assises_hauteur_max !== null && this.us.us_assises_hauteur_min !== null) {
       this.us.us_assises_hauteur_moyenne = Math.round((this.us.us_assises_hauteur_max + this.us.us_assises_hauteur_min) / 2) ;
    }
  }

}
