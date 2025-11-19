import {Component, Input, OnInit} from '@angular/core';
import {ApiDbTable, ApiSyncableObject} from "../../../../../shared";
import {ModalController} from "@ionic/angular";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {isLinkFaitSectionRelation, isLinkMinuteRelation} from "../../../util/utils";
import {LinkSelection} from "../../../services/castor-object-context.service";

export interface LinkCustomField {
  note?: string;
  type_releve?: string;
  echelle_releve?: string;
  profile?: string;
  largeur?: number;
  hauteur?: number;
  z_supp?: number;
  z_inf?: number;
}

@Component({
  selector: 'app-link-object-created-modal',
  templateUrl: './link-object-created-modal.component.html',
  styleUrls: ['./link-object-created-modal.component.scss']
})
export class LinkObjectCreatedModalComponent implements OnInit {

  @Input() reference: dbBoundObject<ApiSyncableObject>;
  @Input() target: LinkSelection;
  @Input() sectorUuid: string;
  @Input() faitUuid: string;
  @Input() usUuid: string;

  customField: LinkCustomField = {
    note: ''
  };

  constructor(private modalCtrl: ModalController) { }

  ngOnInit(): void {
  }

  onObjectCreated(objectUuid?: string) {
    return this.modalCtrl.dismiss({objectUuid: objectUuid, customField: this.customField});
  }

  cancelClicked() {
    return this.modalCtrl.dismiss({objectUuid: null, customField: null});
  }

  isMinuteRelation(): boolean {
    return isLinkMinuteRelation(this.reference, this.target);
  }

  isFaitSectionRelation(): boolean {
    return isLinkFaitSectionRelation(this.reference, this.target);
  }

}
