import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {ApiSyncableObject} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {ConfirmationService} from "../../../services/confirmation.service";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {tap} from "rxjs/operators";
import {Location} from "@angular/common";

export interface InfoToDisplayItemHeadband {
  title?: Array<{key: string, keyType: 'string' | 'type' | 'custString'}>;
  subTitle?: Array<{key: string, keyType: 'string' | 'type' | 'custString'}>;
}

@Component({
  selector: 'app-headband-item-header',
  templateUrl: './headband-item-header.component.html',
  styleUrls: ['./headband-item-header.component.scss']
})
export class HeadbandItemHeaderComponent implements OnInit, AfterViewInit {

  @Input() item: dbBoundObject<ApiSyncableObject>;
  @Input() infoToDisplay: InfoToDisplayItemHeadband;
  @Input() labelBackgroundColor: string;

  constructor(private w: WorkerService, private confirmation: ConfirmationService, private location: Location) { }

  ngOnInit(): void {
    // this.updateFirstLastObject();
  }

  ngAfterViewInit(): void {
    /*this.w.data().objects[this.item.info.ref_table === 'us' ?
      this.item.info.ref_table : this.item.info.obj_table].checkIsLastOrFirstOfList(this.item);*/
  }

  onForward() {
    if (this.item.info.type === 'object') {
      this.w.data().objects[['us', 'section', 'echantillon', 'document'].includes(this.item.info.ref_table) ?
        this.item.info.ref_table : this.item.info.obj_table]?.selectNext();
      // this.updateFirstLastObject();
    }
  }

  onBackward() {
    if (this.item.info.type === 'object') {
      this.w.data().objects[['us', 'section', 'echantillon', 'document'].includes(this.item.info.ref_table) ?
        this.item.info.ref_table : this.item.info.obj_table]?.selectPrevious();
    }
  }

  isFirstObject(): boolean {
    return this.w.data().objects[['us', 'section', 'echantillon', 'document'].includes(this.item.info.ref_table) ?
      this.item.info.ref_table : this.item.info.obj_table]?.isFirstObject;
  }

  isLastObject(): boolean {
    return this.w.data().objects[['us', 'section', 'echantillon', 'document'].includes(this.item.info.ref_table) ?
      this.item.info.ref_table : this.item.info.obj_table]?.isLastObject;
  }

  deleteObject() {
    this.confirmation.showConfirmDialog('Attention !',
      'Voulez-vous supprimer cet objet ?',
      () => {
      this.item.item.live = false;
      this.item.commit(this.item.item).pipe(tap(() => {
        this.location.back();
      })).subscribe();
    }, () => {});
  }

}
