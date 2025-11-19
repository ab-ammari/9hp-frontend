import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {ApiDbTable, ApiSyncableType, ApiTypeCategory} from "../../../../../shared";
import {DB} from "../../../Database/DB";
import {Subject} from "rxjs";
import {filter, takeUntil, tap} from "rxjs/operators";
import {handleObjectUUID} from "../../../Database/db-utils";
import {IonModal} from "@ionic/angular";
import {LOG, LoggerContext} from "ngx-wcore";

export interface ImageType {
  [key: string]: string
}

const CONTEXT: LoggerContext = {
  origin: 'CastorTypeSelectorComponent'
}

@Component({
  selector: 'app-castor-type-selector',
  templateUrl: './castor-type-selector.component.html',
  styleUrls: ['./castor-type-selector.component.scss']
})
export class CastorTypeSelectorComponent implements OnInit, OnDestroy, OnChanges {

  @Input() prefix: boolean = false;
  @Input() editable: boolean = true;
  @Input() imageMode: boolean = false;
  @Input() imageMap: ImageType;

  @Input() title: string = 'Type';
  @Input() showTitle: boolean = false;

  @Input() category: ApiTypeCategory;
  selection: ApiSyncableType;

  @Input() value: string; // type_uuid
  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();

  @Input() enableClearValue: boolean = false;

  @Input() selectedType: ApiSyncableType;
  @Output() selectedTypeChange: EventEmitter<ApiSyncableType> = new EventEmitter<ApiSyncableType>();

  @Input() dismissParentPopover: boolean;

  @Input() labelStyle:  {
    [klass: string]: any;
  };

  @ViewChild('modal') modal: IonModal;

  type_list: Array<ApiSyncableType>;

  modal_id: string = handleObjectUUID(null);
  createNewInterface: boolean = false;
  $subscriber: Subject<unknown> = new Subject<unknown>();
  list_filter: string;

  constructor() {
  }

  ngOnInit(): void {
    this.fetch_types();
    console.log("imageMode", this.imageMode, "image map", this.imageMap);
    DB.database.on_change.pipe(
      takeUntil(this.$subscriber),
      filter(value => value.table === 'type'),
      tap(() => this.fetch_types())
    ).subscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.initSelection();
  }

  ngOnDestroy() {
    this.$subscriber.next(true);
  }


  fetch_types() {
    LOG.debug.log({...CONTEXT, action: 'fetch_types'}, this.category);

    DB.database.type.list(this.category).pipe(
      tap((list) => {
        LOG.debug.log({...CONTEXT, action: 'fetch_types'}, list);
        this.type_list = list;
        this.orderTypeList();
        this.initSelection();
      })
    ).subscribe();
  }

  initSelection(){
    this.selection = this.type_list?.find(item => item.type_uuid === this.value);
    this.selectedType = this.selection;
    this.selectedTypeChange.emit(this.selection);
  }

  orderTypeList() {
    switch (this.category) {
      case ApiTypeCategory.FAIT_ETAT:
        // Order of fait etat type list : Annulée, Non fouillé, photographie, sondages, 50%, 100%
        const order = ["009be7ec-7e85-4710-b453-fc239288aae1", "cde82d36-4c81-46e6-9613-1435556a948a",
          "d14b110e-d2a5-4e07-afee-ea7572f29f06", "571fb858-0ddc-4d2b-a07b-02dc8883c45e",
          "d8bd0bc2-7576-4a1c-b523-bed6ea72e359", "0140353c-21b3-4a62-9621-01f21c8bebdb"];
        this.type_list = this.sortListByOrder(this.type_list, order);
        break;
      case ApiTypeCategory.US_POSITIVE_INCLUSIONS_GRANULARITE:
        const granulariteOrder = ["267d483d-5948-40c8-a652-649ebf8facdf", "9b1a1670-7a29-4b79-aa64-09e277fcc5d4", "0bb4e27f-b8d6-426a-90b1-707842c8dcc9"];
        this.type_list = this.sortListByOrder(this.type_list, granulariteOrder);
        break;
      default:
        return;
    }
  }

  sortListByOrder(list: Array<ApiSyncableType>, order: Array<string>): Array<ApiSyncableType> {
    return list.sort((a, b) => {
      return order.indexOf(a.type_uuid) - order.indexOf(b.type_uuid);
    });
  }

  createNewType(prefix: string, value: string) {
    LOG.debug.log({...CONTEXT, action: 'createNewType'}, 'extract prefix ' + prefix ?? (value ? value.substr(0, 3) : "???"), 'value ' + value, 'prefix ' + prefix, value.substr(0, 3));
    const newType: ApiSyncableType = {
      type_uuid: null,
      projet_uuid: null,
      table: ApiDbTable.type,
      type_category_uuid: this.category,
      type_prefix: prefix ? prefix : (value ? value.substr(0, 3) : "???"),
      type_label: value,
      draft: true,
    }
    DB.database.type.save(newType).subscribe(() => {
      this.createNewInterface = false;
    });
  }

  selectType(type: ApiSyncableType) {
    this.selection = type;
    this.selectedType = type;
    this.selectedTypeChange.emit(type);
    this.value = type.type_uuid;
    this.valueChange.emit(type.type_uuid);
    // this.popover.dismiss(null, 'dismiss', this.dismissParentPopover);
    this.modal.dismiss(null, 'dismiss');
  }

  clearValue() {
    this.value = null;
    this.valueChange.emit(null);
  }

  getImageForType(type_uuid: string): string {
    if (this.imageMap) {
      return this.imageMap[type_uuid] || "assets/images/image_type/imageNotFound.png";
    } else {
      return "assets/images/image_type/imageNotFound.png"
    }
  }
}
