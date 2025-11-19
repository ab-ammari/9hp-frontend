import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ApiTypeCategory} from "../../../../../shared";
import {IonModal} from "@ionic/angular";

@Component({
  selector: 'app-altitude-form',
  templateUrl: './altitude-form.component.html',
  styleUrls: ['./altitude-form.component.scss']
})
export class AltitudeFormComponent implements OnInit {

  @ViewChild('altitudeModal') altitudeModal: IonModal;

  @Input() zBorn: number;
  @Output() zBornChange = new EventEmitter();

  @Input() showGetFaitZBornBtn: boolean = false;
  @Output() getFaitZBornCallback = new EventEmitter();

  @Input() lectureBorn: number;
  @Output() lectureBornChange = new EventEmitter();

  @Input() showGetFaitLectureBornBtn: boolean = false;
  @Output() getFaitLectureBornCallback = new EventEmitter();

  @Input() zLunette: number;
  @Output() zLunetteChange = new EventEmitter();

  @Input() showGetFaitZLunetteBtn: boolean = false;
  @Output() getFaitZLunetteCallback = new EventEmitter();

  @Input() zAxe: number;
  @Output() zAxeChange = new EventEmitter();

  @Input() zsupp: number;
  @Output() zsuppChange = new EventEmitter();

  @Input() showGetFaitZSuppBtn: boolean = false;
  @Output() getFaitZSuppCallback = new EventEmitter();

  @Input() zinf: number;
  @Output() zinfChange = new EventEmitter();

  @Input() showGetFaitZInfBtn: boolean = false;
  @Output() getFaitZInfCallback = new EventEmitter();

  @Input() absoluteZAxe: number;
  @Output() absoluteZAxeChange = new EventEmitter();

  @Input() absoluteZSupp: number;
  @Output() absoluteZSuppChange = new EventEmitter();

  @Input() showGetFaitAbsZSuppBtn: boolean = false;
  @Output() getFaitAbsZSuppCallback = new EventEmitter();

  @Input() absoluteZInf: number;
  @Output() absoluteZInfChange = new EventEmitter();

  @Input() showGetFaitAbsZInfBtn: boolean = false;
  @Output() getFaitAbsZInfCallback = new EventEmitter();

  /* BTN CALCULATOR STUFF */
  @Input() showZSuppCalculatorIcon: boolean = false;
  @Output() btnZSuppCalcCallback = new EventEmitter();

  @Input() showZInfCalculatorIcon: boolean = false;
  @Output() btnZInfCalcCallback = new EventEmitter();

  @Input() isZSupCalculated: boolean = false;
  @Input() isZInfCalculated: boolean = false;

  /* Customize */
  @Input() hideZAxe: boolean;

  constructor() { }

  ngOnInit(): void {
  }
  hideZSupZInfRelatif(): Boolean {
    return !(!this.zBorn || !this.lectureBorn);
  }

  onZBorneChange(value: number) {
    this.zBornChange.emit(value);
    this.calcZLunette();
  }

  onLectureBorneChange(value: number) {
    this.lectureBornChange.emit(value);
    this.calcZLunette();
  }

  onZSuppChange(value: number) {
    this.zsuppChange.emit(value);
    this.calcZSuppLecture();
  }

  onZInfChange(value: number) {
    this.zinfChange.emit(value);
    this.calcZInfLecture();
  }

  calcZLunette() {
    if (this.lectureBorn && this.zBorn) {
      this.zLunette = Math.round((this.zBorn + this.lectureBorn) * 100) / 100;
      this.zLunetteChange.emit(this.zLunette);
    }
  }

  calcZSuppLecture() {
    if (this.zLunette && this.zsupp) {
      this.absoluteZSupp = Math.round((this.zLunette - this.zsupp) * 100) / 100;
      this.absoluteZSuppChange.emit(this.absoluteZSupp);
    }
  }

  calcZInfLecture() {
    if (this.zLunette && this.zinf) {
      this.absoluteZInf = Math.round((this.zLunette - this.zinf) * 100) / 100;
      this.absoluteZInfChange.emit(this.absoluteZInf);
    }
  }

  openRelativeModal() {
    this.altitudeModal.present();
  }

  onWillDismiss(e: Event) {

  }
  closeModal() {
    this.altitudeModal?.dismiss();
  }

}
