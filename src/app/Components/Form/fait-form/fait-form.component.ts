import {Component,  Input,  OnDestroy, OnInit,  } from '@angular/core';
import {ApiFait, ApiSyncableObject,  ApiTypeCategory} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {FaitFormPlanEnum} from "../../../../../shared/objects/models/enums/FormPlanEnum";
import { map,  tap} from "rxjs/operators";
import {Location} from "@angular/common";
import { Observable, of} from "rxjs";
import {LOG, LoggerContext} from "ngx-wcore";
import {v4} from "uuid";
import {SelectionHook} from "../../../DataClasses/models/castor-abstract-object-data-class";
import {SyncedStorage} from "../../../util/storage-utilities";


const CONTEXT: LoggerContext = {
  origin: 'FaitFormComponent'
}
@Component({
  selector: 'app-fait-form',
  templateUrl: './fait-form.component.html',
  styleUrls: ['./fait-form.component.scss']
})
export class FaitFormComponent implements OnInit, OnDestroy {

  private trackBy: (f: ApiFait) => string = (f) => f.fait_uuid;
  private _fait: SyncedStorage<ApiFait> = SyncedStorage.init(this.trackBy );

  @Input() set fait(fait: ApiFait) {
    this._fait = SyncedStorage.negociate(fait, this._fait,this.trackBy);
  };
  get fait(): ApiFait {
    return this._fait?.value;
  }

  @Input() unSavedForm: boolean;




  FaitFormPlanEnum = FaitFormPlanEnum;
  ApiTypeCategory = ApiTypeCategory;
  stratigraphieFormValid: boolean;

  constructor(public w: WorkerService, private location: Location) {
  }

  readonly hook: SelectionHook<ApiFait> = {
    id: v4(),
    callback: change => {
      return this.validFait().pipe(
        map(result => change),
        tap(value => {
          LOG.debug.log('VALID FAIT', value);
        })
      );
    }
  };
  ngOnInit(): void {
    this.w.data().objects.fait.addHook(this.hook);
  }

  ngOnDestroy() {
    LOG.debug.log({...CONTEXT, action: 'ngOnDestroy'}, this.unSavedForm);
    this.w.data().objects.fait.removeHook(this.hook);
    this.validFait().subscribe();
  }

  generalityNotValid(): boolean {
    return !(this.fait?.fait_methode_manual || this.fait?.fait_methode_mechanical);
  }

  mesureNotValid(): boolean {
    return !(this.fait?.fait_z_inf && this.fait?.fait_z_sup);
  }

  onChangeForm() {
    if (this.unSavedForm) {
      LOG.debug.log({...CONTEXT, action: 'onChangeForm'}, this.unSavedForm);
      return;
    } else {
      this.unSavedForm = true;

    }
    LOG.debug.log({...CONTEXT, action: 'onChangeForm'}, this.unSavedForm);
  }

  calcFaitHeight() {
    // zSup and zInf is meter
    const zSupNgf = this.fait.fait_absolute_z_sup;
    const zInfNgf = this.fait.fait_absolute_z_inf;
    this.fait.fait_dim_hauteur = Math.round(((zSupNgf - zInfNgf) * 1000) * 100) / 100;
  }

  calcFaitZSup() {
    // zInf is meter, height is mm
    const zInfNgf = this.fait.fait_absolute_z_inf;
    const hauteur = this.fait.fait_dim_hauteur / 1000;
    this.fait.fait_absolute_z_sup = Math.round((zInfNgf + hauteur) * 100) /100;
  }

  calcFaitZInf() {
    // zSup is meter, height is mm
    const zSupNgf = this.fait.fait_absolute_z_sup;
    const hauteur = this.fait.fait_dim_hauteur / 1000;
    this.fait.fait_absolute_z_inf = Math.round((zSupNgf - hauteur) * 100) / 100;
  }

  isHeightCalculated(): boolean {
    return this.fait.fait_dim_hauteur == Math.round(((this.fait.fait_absolute_z_sup - this.fait.fait_absolute_z_inf) * 1000) * 100) / 100;
  }

  validFait(): Observable<Array<ApiSyncableObject>> {
    console.log("fait updated", this.fait);
    if (this.unSavedForm) {
      this.unSavedForm = false;
      return this.w.data().objects.fait.selected.commit(this.fait);
    }
    return of(undefined);

  }

  onBack() {
    this.location.back();
  }

}
