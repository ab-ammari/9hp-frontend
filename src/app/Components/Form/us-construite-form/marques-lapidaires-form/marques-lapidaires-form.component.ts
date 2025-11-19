import {Component, Input} from '@angular/core';
import {ApiUsConstruite, ApiUsConstruiteMarquesLapidaires, ApiTypeCategory, ApiDbTable} from "../../../../../../shared";

@Component({
  selector: 'app-marques-lapidaires-form',
  templateUrl: './marques-lapidaires-form.component.html',
  styleUrls: ['./marques-lapidaires-form.component.scss']
})
export class MarquesLapidairesFormComponent {

  @Input() us: ApiUsConstruite;

  protected readonly ApiTypeCategory = ApiTypeCategory;

  typeMarqueToAdd: string;
  numberToAdd: number;
  localisationToAdd: string;
  descriptionToAdd: string;

  isValidForm(): boolean {
    return !!this.typeMarqueToAdd
      && !!this.numberToAdd
      && !!this.localisationToAdd
      && !!this.descriptionToAdd;
  }

  deleteRow(usMarqueLapidaire: ApiUsConstruiteMarquesLapidaires, index: number) {
    usMarqueLapidaire.live = false;
  }

  addRow() {
    if (!this.us?.us_marques_lapidaires) {
      this.us.us_marques_lapidaires = [];
    }
    this.us?.us_marques_lapidaires.push({
      author_uuid: this.us.author_uuid,
      live: true,
      projet_uuid: this.us.projet_uuid,
      table: ApiDbTable.us_fourrure,
      created: 0,
      versions: [],
      us_marques_lapidaires_type: this.typeMarqueToAdd,
      us_marques_lapidaires_nombre: this.numberToAdd,
      us_marques_lapidaires_localisation: this.localisationToAdd,
      us_marques_lapidaires_description: this.descriptionToAdd,
    });
    this.cleanVar();
  }

  cleanVar() {
    this.typeMarqueToAdd = null;
    this.numberToAdd = null;
    this.localisationToAdd = null;
    this.descriptionToAdd = null;
  }
}
