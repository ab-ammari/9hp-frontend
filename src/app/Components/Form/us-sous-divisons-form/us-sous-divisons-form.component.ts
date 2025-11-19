import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiDbTable, ApiTypeCategory, ApiUs, ApiUsSousDivision} from "../../../../../shared";

@Component({
  selector: 'app-us-sous-divisons-form',
  templateUrl: './us-sous-divisons-form.component.html',
  styleUrls: ['./us-sous-divisons-form.component.scss']
})
export class UsSousDivisonsFormComponent implements OnInit {

  @Input() us: ApiUs;

  unSavedForm: boolean;

  constructor() {
  }

  descriptionToAdd: string;
  numberToAdd: string;
  typeToAdd: string;
  dimensionsToAdd: string;
  zsupToAdd: string;
  zinfToAdd: string;
  ApiTypeCategory = ApiTypeCategory;

  ngOnInit(): void {
  }

  deleteRow(sousDivision: ApiUsSousDivision, index: number) {
    sousDivision.live = false;
    this.unSavedForm = true;
  }

  addRow() {
    if (!this.us?.sous_divisions) {
      this.us.sous_divisions = [];
    }
    this.us?.sous_divisions.push({
      author_uuid: this.us.author_uuid,
      live: true,
      projet_uuid: this.us.projet_uuid,
      table: ApiDbTable.us_sous_division,
      created: 0,
      versions: [],
      description: this.descriptionToAdd,
      number: this.numberToAdd,
      type_sous_division_uuid: this.typeToAdd,
      dimensions: this.dimensionsToAdd,
      zsup: this.zsupToAdd,
      zinf: this.zinfToAdd
    });
    this.cleanVar();
  }

  cleanVar() {
    this.descriptionToAdd = null;
    this.numberToAdd = null;
    this.typeToAdd = null;
    this.dimensionsToAdd = null;
    this.zsupToAdd = null;
    this.zinfToAdd = null
  }

}
