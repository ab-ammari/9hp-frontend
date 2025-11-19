import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {ApiDbTable, ApiDocument, ApiSyncableObject} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {handleObjectUUID} from "../../../Database/db-utils";
import {LOG, LoggerContext} from "ngx-wcore";
import {end} from "@popperjs/core";
import {IonModal} from "@ionic/angular";
import {getObjectUuid} from "../../../util/utils";
import {isDocument} from "../../../util/castor-object-cast";


const CONTEXT: LoggerContext =  {
  origin: 'CastorObjectSelectorComponent'
}

@Component({
  selector: 'app-castor-object-selector',
  templateUrl: './castor-object-selector.component.html',
  styleUrls: ['./castor-object-selector.component.scss']
})
export class CastorObjectSelectorComponent<TYPE extends ApiSyncableObject> implements OnInit, OnChanges {

  @Input() disabled: boolean = false;
  @Input() required: boolean = false;

  @Input() list: Array<dbBoundObject<TYPE>> = [];
  private _filtered_list: Array<dbBoundObject<TYPE>>;
  set filtered_list(value: Array<dbBoundObject<TYPE>>) {
    this._filtered_list = value;
  };
  get filtered_list(): Array<dbBoundObject<TYPE>> {
    return this._filtered_list;
  }
  @Input() filter: (obj: TYPE) => boolean = (obj: TYPE) => true;
  @Input() filterByObject: filterByObject;
  @Input() labelFactory: (obj: TYPE) => string = (obj: TYPE) => obj['tag'] ?? obj.tag_detail?.tag ?? getObjectUuid(obj);
  @Input() placeholder: string = 'Select';

  @ViewChild('modal') modal: IonModal;

  @Input() selection: dbBoundObject<TYPE>;
  @Output() selectionChange: EventEmitter<dbBoundObject<TYPE>> = new EventEmitter<dbBoundObject<TYPE>>();



  modal_id: string = handleObjectUUID(null);
  list_filter: string = '';
  constructor(protected w : WorkerService) { }

  ngOnInit(): void {
    LOG.debug.log({...CONTEXT}, this.list);
    this.filterList();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.filterList();
    }

  filterList(filter: string = this.list_filter) {
    this.list_filter = filter;
    this.filtered_list = this.list.filter(item => this.filter(item.item));
    this.filtered_list = this.filtered_list.filter(item => (this.labelFactory(item.item).includes(this.list_filter) || !this.list_filter));
   // LOG.debug.log({...CONTEXT, action: 'filterList()'}, this.filtered_list);
    this.filtered_list = this.filtered_list.filter(item => {
      for (let prop in this.filterByObject) {
       if (this.filterByObject[prop] && item.item[prop] && this.filterByObject[prop] !== item.item[prop]) {
         return false;
       }
      }
      return true;
    })
    if (!this.filtered_list.some(item => item.item.created === this.selection?.item.created)) {
      this.unselect();
    }
  }

  select(item: dbBoundObject<TYPE>) {
    if (this.selection?.item?.created === item.item.created){
      this.unselect();
    } else {
      this.selection = item;
      this.selectionChange.emit(item);
      this.modal.dismiss();
    }
    LOG.debug.log({...CONTEXT, action: 'select()'}, this.selection);
  }

  unselect(){
    this.selection = null;
    this.selectionChange.emit(null);
  }

  protected readonly ApiDbTable = ApiDbTable;
  protected readonly isDocument = isDocument;
}


export interface filterByObject {
  fait_uuid?: string;
  secteur_uuid?: string;
  ensemble_uuid?: string;
  projet_uuid?: string;
}
