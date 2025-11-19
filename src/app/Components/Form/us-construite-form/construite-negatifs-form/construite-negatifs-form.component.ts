import {Component, Input} from '@angular/core';
import {
  ApiDbTable,
  ApiTypeCategory,
  ApiUsConstruite,
  ApiUsConstruiteNegatifs,
  ApiUsFourrure
} from "../../../../../../shared";

@Component({
  selector: 'app-construite-negatifs-form',
  templateUrl: './construite-negatifs-form.component.html',
  styleUrls: ['./construite-negatifs-form.component.scss']
})
export class ConstruiteNegatifsFormComponent {

  @Input() us: ApiUsConstruite;

  protected readonly ApiTypeCategory = ApiTypeCategory;

  negatifsTypeToAdd: string;
  negatifsNombreToAdd: number;
  negatifsHauteurToAdd: number;
  negatifsLargeurToAdd: number;
  negatifsProfondeurToAdd: number;


  isValidForm(): boolean {
    return !!this.negatifsTypeToAdd
      && !!this.negatifsNombreToAdd
      && !!this.negatifsHauteurToAdd
      && !!this.negatifsLargeurToAdd
      && !!this.negatifsProfondeurToAdd;
  }

  deleteRow(usConstruiteNegatifs: ApiUsConstruiteNegatifs, index: number) {
    usConstruiteNegatifs.live = false;
  }

  addRow() {
    if (!this.us?.us_construite_negatifs) {
      this.us.us_construite_negatifs = [];
    }
    this.us?.us_construite_negatifs.push({
      author_uuid: this.us.author_uuid,
      live: true,
      projet_uuid: this.us.projet_uuid,
      table: ApiDbTable.us_fourrure,
      created: 0,
      versions: [],
      us_negatifs_type: this.negatifsTypeToAdd,
      us_negatifs_number: this.negatifsNombreToAdd,
      us_negatifs_hauteur: this.negatifsHauteurToAdd,
      us_negatifs_largeur: this.negatifsLargeurToAdd,
      us_negatifs_profondeur: this.negatifsProfondeurToAdd
    });
    this.cleanVar();
  }

  cleanVar() {
    this.negatifsTypeToAdd = null;
    this.negatifsNombreToAdd = null;
    this.negatifsHauteurToAdd = null;
    this.negatifsLargeurToAdd = null;
    this.negatifsProfondeurToAdd = null;
  }

}
