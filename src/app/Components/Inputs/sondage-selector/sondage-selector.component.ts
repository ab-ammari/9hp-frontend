import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {ApiSection} from "../../../../../shared";

@Component({
  selector: 'app-sondage-selector',
  templateUrl: './sondage-selector.component.html',
  styleUrls: ['./sondage-selector.component.scss']
})
export class SondageSelectorComponent implements OnInit {

  @Input() sondageArray: Array<dbBoundObject<ApiSection>> | undefined;

  @Input() selectedSondageUuid: string;
  @Output() selectedSondageUuidChange = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
    console.log("sondage array :::", this.sondageArray)
  }

}
