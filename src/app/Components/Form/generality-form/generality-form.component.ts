import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {ApiDbTable, ApiSyncableObject, ApiTypeCategory} from "../../../../../shared";

@Component({
  selector: 'app-generality-form',
  templateUrl: './generality-form.component.html',
  styleUrls: ['./generality-form.component.scss']
})
export class GeneralityFormComponent implements OnInit {

  /* Localisation */
  @Input() selectedSectorUuid: string;
  @Output() selectedSectorUuidChange = new EventEmitter();
  @Input() precision: string;
  @Output() precisionChange = new EventEmitter();

  /* Fouille */
  @Input() manualMethode: boolean;
  @Output() manualMethodeChange = new EventEmitter();

  @Input() mechanicalMethode: boolean;
  @Output() mechanicalMethodeChange = new EventEmitter();

  @Input() stat: string;
  @Output() statChange = new EventEmitter();

  /* Fiche */
  @Input() createdDate: number;

  @Input() updatedDate: number;

  @Input() author: string;
  @Input() object: ApiSyncableObject;

  /* Personalize */
  @Input() hideFaitSelector: boolean;

  ApiTypeCategory = ApiTypeCategory;
  ApiDbTable = ApiDbTable;

  constructor(public w: WorkerService) {
  }

  ngOnInit(): void {
  }

}
