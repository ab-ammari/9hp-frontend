import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {CastorSyncService} from "../../../services/castor-sync.service";
import {UI} from "../../../util/ui";
import {DEV} from "../../../util/dev";
import {Subject} from "rxjs";
import {filter, takeUntil, tap} from "rxjs/operators";

@Component({
  selector: 'app-castor-sync-progress-display',
  templateUrl: './castor-sync-progress-display.component.html',
  styleUrls: ['./castor-sync-progress-display.component.scss']
})
export class CastorSyncProgressDisplayComponent implements OnInit, OnDestroy {

  totalCount: number;

  get stats(): Array<StatsLayoutBucket> {
    return [
      {
        label: 'Count',
        value: this.w.data().archive.initialTotal
      },
      {
        label: 'Success',
        value: this.w.data().archive.validated
      },
      {
        label: 'Pending',
        value: this.w.data().archive.pending
      },
      {
        label: 'Locked',
        value: this.w.data().archive.locked
      },
      {
        label: 'Errors',
        value: this.w.data().archive.errored
      },
    ];
  }
  private readonly destroyer: Subject<void> = new Subject();
  constructor(public w: WorkerService, public syncService: CastorSyncService) { }

  ngOnDestroy() {
    this.destroyer.next();
  }

  ngOnInit(): void {

    UI.state.onStoreChange.pipe(
      takeUntil(this.destroyer),
      tap((store) => {
        this.calculateTotalCount(store?.projet_uuid);
      })
    ).subscribe();
    this.calculateTotalCount(UI.state.store.projet_uuid);
  }

  private calculateTotalCount(projet_uuid?: string) {
    if (projet_uuid) {
      this.totalCount = this.w.data().project_index.find(proj => proj.projet_uuid === projet_uuid).amount_objects;
    } else {
      this.totalCount = 0;
      this.w.data().project_index.forEach(proj => {
        this.totalCount = this.totalCount + proj.amount_objects;
      });

    }
  }


  protected readonly DEV = DEV;
}


interface StatsLayoutBucket {
  label: string;
  value: number;
}
