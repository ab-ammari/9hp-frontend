import {Component, Input, OnInit} from '@angular/core';
import {dbBoundObject} from "../../../../../../../../DataClasses/models/db-bound-object";
import {ApiFait} from "../../../../../../../../../../shared";

@Component({
  selector: 'app-castor-link-fait-table-display',
  templateUrl: './castor-link-fait-table-display.component.html',
  styleUrls: ['./castor-link-fait-table-display.component.scss']
})
export class CastorLinkFaitTableDisplayComponent implements OnInit {

  @Input() faits: Array<dbBoundObject<ApiFait>>;

  constructor() { }

  ngOnInit(): void {
  }

}
