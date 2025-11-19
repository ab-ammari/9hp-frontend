import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {CastorSyncService} from "../../../services/castor-sync.service";
import {Subject} from "rxjs";
import {filter, takeUntil, tap} from "rxjs/operators";
import {ApiDbTable, ApiProjectIndex} from "../../../../../shared";
import {DataActions} from "../../../../../shared/actions/data-actions";

@Component({
  selector: 'app-headband-town-display',
  templateUrl: './headband-town-display.component.html',
  styleUrls: ['./headband-town-display.component.scss']
})
export class HeadbandTownDisplayComponent implements OnInit, OnDestroy {

  index: ApiProjectIndex;
  private destroyer: Subject<void> = new Subject<void>();
  constructor(public w: WorkerService, public sync: CastorSyncService) { }

  ngOnInit(): void {
    this.sync.indexes.pipe(
      takeUntil(this.destroyer),
      tap((value) => {
          this.index = value.find(proj => proj.projet_uuid === this.w.data().projet.selected?.uuid);
        }
      )
    ).subscribe();
  }

  ngOnDestroy() {
    this.destroyer.next();
  }

  loadIndex(last_synchro_ms: number = null) {
    this.w.network(DataActions.RETRIEVE_PROJET_INDEX, {
      projets: [{
       projet_uuid: this.index?.projet_uuid,
       last_synchro_ms
      }],
      spam_me: false
    })
  }

  protected readonly ApiDbTable = ApiDbTable;
}
