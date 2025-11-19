import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {UsTypeEnum} from "../../../../../shared/objects/models/enums/UsTypeEnum";

interface usTypeSelect {
  value: UsTypeEnum;
  viewValue: string;
}

@Component({
  selector: 'app-us-type-selector',
  templateUrl: './us-type-selector.component.html',
  styleUrls: ['./us-type-selector.component.scss']
})
export class UsTypeSelectorComponent implements OnInit {

  @Input() selectedUsType: UsTypeEnum;
  @Output() selectedUsTypeChange = new EventEmitter();
  @Input() selectorLabel: string = "Sélectionnez un type d'US";

  usTypeSelection: Array<usTypeSelect> = [
    { value: UsTypeEnum.TECHNIQUE, viewValue: 'Technique'},
    { value: UsTypeEnum.CONSTRUITE, viewValue: 'Construite'},
    { value: UsTypeEnum.NEGATIVE, viewValue: 'Négative'},
    { value: UsTypeEnum.POSITIVE, viewValue: 'Positive'},
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
