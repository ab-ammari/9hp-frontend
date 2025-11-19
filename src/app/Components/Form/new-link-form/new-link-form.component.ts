import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiTypeCategory} from "../../../../../shared";

@Component({
  selector: 'app-new-link-form',
  templateUrl: './new-link-form.component.html',
  styleUrls: ['./new-link-form.component.scss']
})
export class NewLinkFormComponent implements OnInit {

  protected readonly ApiTypeCategory = ApiTypeCategory;

  /* Global */
  @Input() note: string;
  @Output() noteChange = new EventEmitter();

  @Input() disableNote: boolean = true;
  /* Minutes link */
  @Input() isMinuteRelation: boolean;

  @Input() typeReleve: string
  @Output() typeReleveChange = new EventEmitter();

  @Input() echelleReleve: string;
  @Output() echelleReleveChange = new EventEmitter();

  /* Fait section link */
  @Input() isFaitSectionRelation: boolean;

  @Input() profile: string;
  @Output() profileChange = new EventEmitter();

  @Input() largeur: number;
  @Output() largeurChange = new EventEmitter();

  @Input() hauteur: number;
  @Output() hauteurChange = new EventEmitter();

  @Input() z_supp: number;
  @Output() z_suppChange = new EventEmitter();

  @Input() z_inf: number;
  @Output() z_infChange = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }
}
