import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiSyncableObject, ApiTypeCategory} from "../../../../../shared";

@Component({
  selector: 'app-minute-link-form',
  templateUrl: './minute-link-form.component.html',
  styleUrls: ['./minute-link-form.component.scss']
})
export class MinuteLinkFormComponent implements OnInit {

  protected readonly ApiTypeCategory = ApiTypeCategory;

  @Input() disable: boolean;
  @Input() link: ApiSyncableObject;
  @Output() handleValidClick = new EventEmitter<{
    type_releve: string;
    echelle_releve: string;
    note: string;
  }>();

  typeReleve: string;
  echelleReleve: string;
  note: string;

  constructor() {
  }

  ngOnInit(): void {
    if (this.link) {
      this.typeReleve = this.link['type_releve'];
      this.echelleReleve = this.link['echelle_releve'];
      this.note = this.link['note'];
    }
  }

  valid() {
    this.handleValidClick.emit(
      {
        type_releve: this.typeReleve,
        echelle_releve: this.echelleReleve,
        note: this.note
      });
  }

}
