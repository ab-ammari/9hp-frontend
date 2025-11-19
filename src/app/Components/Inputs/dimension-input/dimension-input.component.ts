import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {CastorDimension} from "../../../util/CastorDimension";

@Component({
  selector: 'app-dimension-input',
  templateUrl: './dimension-input.component.html',
  styleUrls: ['./dimension-input.component.scss']
})
export class DimensionInputComponent implements OnInit, OnChanges {

  @Input() titleLabel: string;

  @Input() mode: 'classic' | 'area' | 'volume' = 'classic';

  @Input() dimension: number; /* Get dimension in mm */
  @Output() dimensionChange = new EventEmitter(); /* Send the dimension in mm*/

  @Input() showBtnGetFaitMeasure: boolean = false;
  @Output() btnGetFaitMeasureCallback = new EventEmitter();

  @Input() showIconCalculator: boolean = false;
  @Output() btnCalculatorCallBack = new EventEmitter();

  @Input() inputClass: string | string[] | Set<string> | {[p: string]: any} | null | undefined;

  castor_dimension: CastorDimension;
  toggleMeterBool: boolean = false;

  constructor() { }

  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.dimension) {
      this.castor_dimension = new CastorDimension(this.dimension, this.mode);
    }
  }

  toggleMeter() {
    this.toggleMeterBool = !this.toggleMeterBool;
  }

  syncDimension() {
    this.dimension = this.castor_dimension.millimeter;
    this.dimensionChange.emit(this.dimension);
  }

  clickBtnGetFaitMeasure(event: Event) {
    this.btnGetFaitMeasureCallback.emit(event);
  }

  clickBtnCalculator(event: Event) {
    this.btnCalculatorCallBack.emit(event);
  }
}
