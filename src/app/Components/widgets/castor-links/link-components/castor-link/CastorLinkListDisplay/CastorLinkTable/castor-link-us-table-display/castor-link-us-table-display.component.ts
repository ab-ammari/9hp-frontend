import {Component, Input, OnInit} from '@angular/core';
import {dbBoundObject} from "../../../../../../../../DataClasses/models/db-bound-object";
import {ApiUs} from "../../../../../../../../../../shared";

@Component({
  selector: 'app-castor-link-us-table-display',
  templateUrl: './castor-link-us-table-display.component.html',
  styleUrls: ['./castor-link-us-table-display.component.scss']
})
export class CastorLinkUsTableDisplayComponent implements OnInit {

  @Input() usArray: Array<dbBoundObject<ApiUs>>;

  constructor() { }

  ngOnInit(): void {
  }

}
