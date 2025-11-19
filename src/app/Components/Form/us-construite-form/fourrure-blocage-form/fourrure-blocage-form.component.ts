import {Component, Input} from '@angular/core';
import {ApiDbTable, ApiTypeCategory, ApiUsConstruite, ApiUsFourrure} from "../../../../../../shared";

@Component({
  selector: 'app-fourrure-blocage-form',
  templateUrl: './fourrure-blocage-form.component.html',
  styleUrls: ['./fourrure-blocage-form.component.scss']
})
export class FourrureBlocageFormComponent {

  @Input() us: ApiUsConstruite;

  protected readonly ApiTypeCategory = ApiTypeCategory;

  fourrureNatureToAdd: string;
  fourrureModuleToAdd: string;
  fourrureDimensionToAdd: number;

  isValidForm() {
    return this.fourrureNatureToAdd && this.fourrureModuleToAdd && this.fourrureDimensionToAdd;
  }

  deleteRow(usFourrureBlocage: ApiUsFourrure, index: number) {
    usFourrureBlocage.live = false;
  }

  addRow() {
    if (!this.us?.us_fourrure_blocage) {
      this.us.us_fourrure_blocage = [];
    }
    this.us?.us_fourrure_blocage.push({
      author_uuid: this.us.author_uuid,
      live: true,
      projet_uuid: this.us.projet_uuid,
      table: ApiDbTable.us_fourrure,
      created: 0,
      versions: [],
      us_fourrure_nature: this.fourrureNatureToAdd,
      us_fourrure_module: this.fourrureModuleToAdd,
      us_fourrure_dimensions: this.fourrureDimensionToAdd
    });
    this.cleanVar();
  }

  cleanVar() {
    this.fourrureNatureToAdd = null;
    this.fourrureModuleToAdd = null;
    this.fourrureDimensionToAdd = null;
  }

}
