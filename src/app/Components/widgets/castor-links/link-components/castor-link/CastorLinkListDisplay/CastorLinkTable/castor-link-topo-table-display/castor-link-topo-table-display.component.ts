import {Component, Input, OnInit} from '@angular/core';
import {dbBoundObject} from "../../../../../../../../DataClasses/models/db-bound-object";
import {ApiDbTable, ApiTopo} from "../../../../../../../../../../shared";

@Component({
  selector: 'app-castor-link-topo-table-display',
  templateUrl: './castor-link-topo-table-display.component.html',
  styleUrls: ['./castor-link-topo-table-display.component.scss']
})
export class CastorLinkTopoTableDisplayComponent implements OnInit {

  @Input() topos:  Array<dbBoundObject<ApiTopo>>;

  constructor() { }

  ngOnInit(): void {
  }

}
