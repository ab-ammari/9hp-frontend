import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { ApiTypeCategory } from 'shared/objects/models/DbInterfaces';

@Component({
  selector: 'app-form-plan-selector',
  templateUrl: './form-plan-selector.component.html',
  styleUrls: ['./form-plan-selector.component.scss']
})
export class FormPlanSelectorComponent implements OnInit {

  @Input() selectedFormPlan: string;
  @Output() selectedFormPlanChange = new EventEmitter();

  ApiTypeCategory = ApiTypeCategory;

  constructor() {
  }

  ngOnInit(): void {
  }

}
