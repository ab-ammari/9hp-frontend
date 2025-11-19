import {Component, Input} from '@angular/core';
import {ApiUsConstruite, ApiTypeCategory, ApiUsConstruiteTracesDeTaille, ApiDbTable} from "../../../../../../shared";

@Component({
  selector: 'app-traces-taille-form',
  templateUrl: './traces-taille-form.component.html',
  styleUrls: ['./traces-taille-form.component.scss']
})
export class TracesTailleFormComponent {

  @Input() us: ApiUsConstruite;

  protected readonly ApiTypeCategory = ApiTypeCategory;

  tracesTailleTypeToAdd: string;
  tracesTaillePositionToAdd: string;

  isValidForm(): boolean {
    return !!this.tracesTailleTypeToAdd
      && !!this.tracesTaillePositionToAdd;
  }

  deleteRow(usTracesTaille: ApiUsConstruiteTracesDeTaille, index: number) {
    usTracesTaille.live = false;
  }

  addRow() {
    if (!this.us?.us_traces_de_taille) {
      this.us.us_traces_de_taille = [];
    }
    this.us?.us_traces_de_taille.push({
      author_uuid: this.us.author_uuid,
      live: true,
      projet_uuid: this.us.projet_uuid,
      table: ApiDbTable.us_fourrure,
      created: 0,
      versions: [],
      us_traces_de_taille_type: this.tracesTailleTypeToAdd,
      us_traces_de_taille_position: this.tracesTaillePositionToAdd,
    });
    this.cleanVar();
  }

  cleanVar() {
    this.tracesTailleTypeToAdd = null;
    this.tracesTaillePositionToAdd = null;
  }

}
