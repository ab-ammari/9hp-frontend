import {Component, Input, OnInit} from '@angular/core';
import {dbBoundObject} from "../../../../../../../../DataClasses/models/db-bound-object";
import {ApiSection} from "../../../../../../../../../../shared";

@Component({
  selector: 'app-castor-link-section-table-display',
  templateUrl: './castor-link-section-table-display.component.html',
  styleUrls: ['./castor-link-section-table-display.component.scss']
})
export class CastorLinkSectionTableDisplayComponent implements OnInit {

  @Input() sections: Array<dbBoundObject<ApiSection>>

  constructor() { }

  ngOnInit(): void {
  }

}
