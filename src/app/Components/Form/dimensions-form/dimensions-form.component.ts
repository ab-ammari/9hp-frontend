import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CastorDimension} from "../../../util/CastorDimension";

@Component({
  selector: 'app-dimensions-form',
  templateUrl: './dimensions-form.component.html',
  styleUrls: ['./dimensions-form.component.scss']
})
export class DimensionsFormComponent implements OnInit {

  @Input() diameter: number;
  @Output() diameterChange = new EventEmitter();
  /* Largeur */
  @Input() width: number;
  @Output() widthChange = new EventEmitter();
  /* Longeur */
  @Input() length: number;
  @Output() lengthChange = new EventEmitter();

  @Input() height: number;
  @Output() heightChange = new EventEmitter();

  @Input() depth: number;
  @Output() depthChange = new EventEmitter();

  @Input() area: number;
  @Output() areaChange = new EventEmitter()

  @Input() volume: number;
  @Output() volumeChange = new EventEmitter();

  @Input() pendage: number;
  @Output() pendageChange = new EventEmitter();

  /* TOGGLE REEL/OBSERVED */
  @Input() toggleReelWidthBool: boolean;
  @Output() toggleReelWidthBoolChange = new EventEmitter();

  @Input() toggleReelLengthBool: boolean;
  @Output() toggleReelLengthBoolChange = new EventEmitter();

  @Input() toggleReelHeightBool: boolean;
  @Output() toggleReelHeightBoolChange = new EventEmitter();

  @Input() toggleReelDiameterBool: boolean;
  @Output() toggleReelDiameterBoolChange = new EventEmitter();

  /* VISIBILITY */
  @Input() hideReelLengthBool: boolean;
  @Input() hideReelWidthBool: boolean;

  @Input() hideDiameter: boolean;
  @Input() hideWidth: boolean;
  @Input() hideLength: boolean;
  @Input() hideHeight: boolean;
  @Input() hidePendage: boolean;
  @Input() hideArea: boolean;
  @Input() hideVolume: boolean;
  @Input() hideDepth: boolean;
  // Get linked fait measurement for us
  @Input() showBtnGetFaitLength: boolean = false;
  @Output() btnGetFaitLengthCallback = new EventEmitter();

  @Input() showBtnGetFaitWidth: boolean = false;
  @Output() btnGetFaitWidthCallback = new EventEmitter();

  @Input() showBtnGetFaitHeight: boolean = false;
  @Output() btnGetFaitHeightCallback = new EventEmitter();

  @Input() showHeightBtnCalculator: boolean = false;
  @Output() btnHeightCalculatorCallBack = new EventEmitter();

  @Input() isHeightCalculated: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  toggleReelWidth() {
    this.toggleReelWidthBool = !this.toggleReelWidthBool;
    this.toggleReelWidthBoolChange.emit(this.toggleReelWidthBool);
  }

  toggleReelLength() {
    this.toggleReelLengthBool = !this.toggleReelLengthBool;
    this.toggleReelLengthBoolChange.emit(this.toggleReelLengthBool);
  }

  toggleReelHeight() {
    this.toggleReelHeightBool = !this.toggleReelHeightBool;
    this.toggleReelHeightBoolChange.emit(this.toggleReelHeightBool);
  }

  toggleReelDiameter() {
    this.toggleReelDiameterBool = !this.toggleReelDiameterBool;
    this.toggleReelDiameterBoolChange.emit(this.toggleReelDiameterBool);
  }

  widthValueChange(event: Event) {
    if (!this.hideArea) {
      this.calArea();
    }
    if (!this.hideVolume) {
      this.calcVolume();
    }
    this.widthChange.emit(event);
  }

  lengthValueChange(event: Event) {
    if (!this.hideArea) {
      this.calArea();
    }
    if (!this.hideVolume) {
      this.calcVolume();
    }
    this.lengthChange.emit(event);
  }

  depthValueChange(event: Event) {
    this.calcVolume();
    this.depthChange.emit(event);
  }

  calArea() {
    if (this.length && this.width) {
      this.area = Math.round((this.length * this.width) * 100) / 100;
      this.areaChange.emit(this.area);
    }
  }

  calcVolume() {
    if (this.length && this.width && this.depth) {
      this.volume = Math.round(( this.length * this.width * this.depth) * 100) / 100;
      this.volumeChange.emit(this.volume);
    }
  }

}
