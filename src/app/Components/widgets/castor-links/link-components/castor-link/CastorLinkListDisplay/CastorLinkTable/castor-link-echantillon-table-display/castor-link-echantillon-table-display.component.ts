import {Component, Input, OnInit} from '@angular/core';
import {dbBoundObject} from "../../../../../../../../DataClasses/models/db-bound-object";
import {ApiDbTable, ApiEchantillon} from "../../../../../../../../../../shared";

@Component({
  selector: 'app-castor-link-echantillon-table-display',
  templateUrl: './castor-link-echantillon-table-display.component.html',
  styleUrls: ['./castor-link-echantillon-table-display.component.scss']
})
export class CastorLinkEchantillonTableDisplayComponent implements OnInit {

  @Input() echantillons: Array<dbBoundObject<ApiEchantillon>>;
  ApiDbTable = ApiDbTable;

  constructor() { }

  ngOnInit(): void {
  }

}
