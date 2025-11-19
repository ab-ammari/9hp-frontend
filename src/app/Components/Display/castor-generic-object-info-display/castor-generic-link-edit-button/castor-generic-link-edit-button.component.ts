import {Component, Input, OnInit} from '@angular/core';
import {
  genericTableDescriptionvalueListMapType
} from "../../generic-content-table/links/generic-content-table.component";
import {LinkEditingModalComponent} from "../../../widgets/link-editing-modal/link-editing-modal.component";
import {ModalController} from "@ionic/angular";
import {LinkTriplet} from "../../../../services/castor-object-context.service";
import {WorkerService} from "../../../../services/worker.service";

@Component({
  selector: 'app-castor-generic-link-edit-button',
  templateUrl: './castor-generic-link-edit-button.component.html',
  styleUrls: ['./castor-generic-link-edit-button.component.scss']
})
export class CastorGenericLinkEditButtonComponent implements OnInit {

  @Input() set triplet( val: genericTableDescriptionvalueListMapType) {
    if ((val as LinkTriplet).target) {
      this._triplet =  val as LinkTriplet;
      this.label = this._triplet.relation.item.table;
    } else {
      this._triplet = null;
    }
  };
  label: string;

  get triplet(): LinkTriplet {
    return this._triplet;
  }

  private _triplet: LinkTriplet;
  constructor(private modalCtrl: ModalController, public w: WorkerService) { }

  ngOnInit(): void {
  }
  async openModal() {

    const modal = await this.modalCtrl.create({
      component: LinkEditingModalComponent,
      componentProps: {
        reference: this.triplet.reference,
        link: this.triplet.relation,
        link_target: this.triplet.target,
        target: this.w.data().context.linkSelection
      }
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();
  }
}
