import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiTypeCategory} from "../../../../../shared";

@Component({
  selector: 'app-form-profile-selector',
  templateUrl: './form-profile-selector.component.html',
  styleUrls: ['./form-profile-selector.component.scss']
})
export class FormProfileSelectorComponent implements OnInit {

  @Input() selectedFormProfile: string;
  @Output() selectedFormProfileChange = new EventEmitter();

  ApiTypeCategory = ApiTypeCategory;

  constructor() { }

  ngOnInit(): void {
  }

}
