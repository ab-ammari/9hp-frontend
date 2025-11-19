import {Component, Input} from '@angular/core';
import {ApiDbTable, ApiSyncableObject, ApiUs} from "../../../../../../../shared";
import {DEV} from "../../../../../util/dev";
import {WorkerService} from "../../../../../services/worker.service";
import {dbBoundObject} from "../../../../../DataClasses/models/db-bound-object";
import {genericContentDescription} from "../generic-content-object-table.component";
import {LoggerContext, LOG} from "@felixkletti/managementjs";
import {CastorUtilitiesService} from '../../../../../services/castor-utilities.service';

const CONTEXT: LoggerContext = {
  origin: 'GenericContentObjectTableRowComponent'
}

@Component({
  selector: '[app-generic-content-object-table-row]',
  templateUrl: './generic-content-object-table-row.component.html',
  styleUrls: ['./generic-content-object-table-row.component.scss']
})
export class GenericContentObjectTableRowComponent {


  @Input() item: dbBoundObject<ApiSyncableObject>;
  @Input() content: genericContentDescription;



  constructor(
    protected w: WorkerService,
    private utils: CastorUtilitiesService
  ) {

  }


  protected readonly ApiDbTable = ApiDbTable;
  protected readonly DEV = DEV;

  deleteOrRestore(item) {

  }

  hasStratigraphie(item: dbBoundObject<ApiSyncableObject>): boolean {
    // Check if item is a US
    if (!this.isUsTable(item.item.table)) {
      return false;
    }

    const us = item.item as ApiUs;
    const strati = this.utils.getStratigraphie(us.us_uuid);
    
    return (strati.anterieur?.length > 0) || 
           (strati.contemporain?.length > 0) || 
           (strati.posterieur?.length > 0);
  }

  get showStratiIcon(): boolean {
    return localStorage.getItem('showStratiIcon') === 'true';
  }

  private isUsTable(table: ApiDbTable): boolean {
    return table === ApiDbTable.us ||
           table === ApiDbTable.us_technique ||
           table === ApiDbTable.us_construite ||
           table === ApiDbTable.us_negative ||
           table === ApiDbTable.us_positive ||
           table === ApiDbTable.us_bati ||
           table === ApiDbTable.us_squelette ||
           table === ApiDbTable.us_construite_materiel ||
           table === ApiDbTable.us_sous_division;
  }
}
