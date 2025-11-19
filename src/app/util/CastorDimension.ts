export class CastorDimension {

  private _centimeter: number;
  set centimeter(val: number) {
    switch (this.mode) {
      case "classic":
        this.init(cmtomm(val))
        break;
      case "area":
        this.init(cm2tomm2(val))
        break;
      case "volume":
        this.init(cm3tomm3(val))
        break;
    }
  }

  get centimeter() {
    return this._centimeter;
  }

  private _meter: number;
  set meter(val: number) {
    switch (this.mode) {
      case "classic":
        this.init(mtomm(val))
        break;
      case "area":
        this.init(m2tomm2(val))
        break;
      case "volume":
        this.init(m3tomm3(val))
        break;
    }
  }

  get meter() {
    return this._meter;
  }

  set millimeter(val: number) {
    this.init(val);
  }

  get millimeter(): number {
    return this._millimeter;
  }


  constructor(private _millimeter: number, public mode: 'classic' | 'area' | 'volume') {
    this.init(this._millimeter);
  }

  init(val: number) {
    if (val !== null) {
      this._millimeter = val;
      switch (this.mode) {
        case "classic":
          this._centimeter = val / MULTIPLIER_cm_mm;
          this._meter = val / MULTIPLIER_m_mm;
          break;
        case "area":
          this._centimeter = val / MULTIPLIER_cm2_mm2;
          this._meter = val / MULTIPLIER_m2_mm2;
          break;
        case "volume":
          this._centimeter = val / MULTIPLIER_cm3_mm3;
          this._meter = val / MULTIPLIER_m3_mm3;
          break;
      }
    }
  }

}

const MULTIPLIER_m_mm = 1000;
const MULTIPLIER_cm_mm = 10;
const MULTIPLIER_m2_mm2 = 1000000;
const MULTIPLIER_cm2_mm2 = 100;
const MULTIPLIER_m3_mm3 = 1000000000;
const MULTIPLIER_cm3_mm3 = 1000;


function mtomm(m) {
  return m * MULTIPLIER_m_mm;
}

function cmtomm(cm) {
  return cm * MULTIPLIER_cm_mm;
}

function m2tomm2(m) {
  return m * MULTIPLIER_m2_mm2;
}

function cm2tomm2(cm) {
  return cm * MULTIPLIER_cm2_mm2;
}

function m3tomm3(m) {
  return m * MULTIPLIER_m3_mm3;
}

function cm3tomm3(cm) {
  return cm * MULTIPLIER_cm3_mm3;
}
