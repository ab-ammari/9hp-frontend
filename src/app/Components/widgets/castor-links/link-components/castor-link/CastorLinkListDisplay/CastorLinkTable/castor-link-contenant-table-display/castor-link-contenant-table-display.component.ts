import {Component, Input, OnInit} from '@angular/core';
import {dbBoundObject} from "../../../../../../../../DataClasses/models/db-bound-object";
import {ApiContenant} from "../../../../../../../../../../shared";

@Component({
  selector: 'app-castor-link-contenant-table-display',
  templateUrl: './castor-link-contenant-table-display.component.html',
  styleUrls: ['./castor-link-contenant-table-display.component.scss']
})
export class CastorLinkContenantTableDisplayComponent implements OnInit {

  @Input() contenants: Array<dbBoundObject<ApiContenant>>;

  constructor() { }

  ngOnInit(): void {
  }

}
