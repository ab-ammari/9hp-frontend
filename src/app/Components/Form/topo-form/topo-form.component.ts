import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ApiDocument, ApiSynchroFrontInterfaceEnum, ApiTopo, ApiTypeCategory} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {map, tap} from "rxjs/operators";
import {A} from "../../../Core-event";
import {Observable, of, Subscription} from "rxjs";
import {SelectionHook} from "../../../DataClasses/models/castor-abstract-object-data-class";
import {v4} from "uuid";
import {LOG} from "ngx-wcore";

@Component({
  selector: 'app-topo-form',
  templateUrl: './topo-form.component.html',
  styleUrls: ['./topo-form.component.scss']
})
export class TopoFormComponent implements OnInit, OnDestroy {



  @Input() topo: ApiTopo;

  @Input() unSavedForm: boolean;


  readonly hook: SelectionHook<ApiTopo> = {
    id: v4(),
    callback: change => {
      return this.validTopo().pipe(
        map(result => change),
        tap(value => {
          LOG.debug.log('VALID FAIT', value);
        })
      );
    }
  };

  ApiTypeCategory = ApiTypeCategory;

  constructor(private w: WorkerService) { }

  ngOnInit(): void {
    this.w.data().objects.topo.addHook(this.hook);

  }
  ngOnDestroy() {
    this.w.data().objects.topo.removeHook(this.hook);

    this.validTopo().subscribe();
  }

  onChangeForm() {
    if (this.unSavedForm) {
      return;
    } else {
      this.unSavedForm = true;

    }
  }

  validTopo() {
    console.log('update topo', this.topo);
    if (this.unSavedForm) {
      this.unSavedForm = false;

      return this.w.data().objects.topo.selected.commit(this.topo);
    } else {
      return of(undefined);
    }

  }

}
