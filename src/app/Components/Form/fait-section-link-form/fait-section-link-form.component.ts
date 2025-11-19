import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiSyncableObject, ApiTypeCategory} from "../../../../../shared";

@Component({
  selector: 'app-fait-section-link-form',
  templateUrl: './fait-section-link-form.component.html',
  styleUrls: ['./fait-section-link-form.component.scss']
})
export class FaitSectionLinkFormComponent implements OnInit {

  @Input() disable: boolean;
  @Input() link: ApiSyncableObject;
  @Output() handleValidClick = new EventEmitter<{
    profile?: string;
    largeur?: number;
    hauteur?: number;
    z_supp?: number;
    z_inf?: number;
    note?: string;
  }>();

  ApiTypeCategory = ApiTypeCategory;

  profile: string;
  largeur: number;
  hauteur: number;
  z_supp: number;
  z_inf: number;
  note: string;

  constructor() { }

  ngOnInit(): void {
    if (this.link) {
      this.profile = this.link['profile'];
      this.largeur = this.link['largeur'];
      this.hauteur = this.link['hauteur'];
      this.z_supp = this.link['z_inf'];
      this.z_inf = this.link['z_supp'];
      this.note = this.link['note'];
    }
  }

  valid() {
    this.handleValidClick.emit({
      profile: this.profile,
      largeur: this.largeur,
      hauteur: this.hauteur,
      z_inf: this.z_inf,
      z_supp: this.z_supp,
      note: this.note
    });
  }

}
