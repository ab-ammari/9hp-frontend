import {Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {ApiDbTable, ApiSyncableType} from "../../../../../shared";
import {Subject} from "rxjs";
import {DB} from "../../../Database/DB";
import {debounceTime, filter, takeUntil, tap} from "rxjs/operators";
import {createDebouncedCallback} from "../../../util/utils";
import {WorkerService} from "../../../services/worker.service";
import {LOG, LoggerContext} from "../../../../lib/w-core/utils/logger";

const CONTEXT: LoggerContext = {
  origin: 'CastorTypeSelectorComponent'
}


@Component({
  selector: 'app-castor-type-display',
  templateUrl: './castor-type-display.component.html',
  styleUrls: ['./castor-type-display.component.scss']
})
export class CastorTypeDisplayComponent implements OnInit, OnDestroy, OnChanges {

  @Input() type: string | ApiSyncableType; // either the uuid or the type Object

  @Input() display_label: boolean = true;
  @Input() display_prefix: boolean = true;

  ref: ApiSyncableType;
  $subscriber: Subject<unknown> = new Subject();

  constructor(
    private w: WorkerService,
    private zone: NgZone
  ) {
  }

  ngOnInit(): void {
    this.syncRef();
    DB.database.on_change.pipe(
      takeUntil(this.$subscriber),
      filter(item => item.table === ApiDbTable.type),
      debounceTime(100),
      tap(() => this.syncRef())
    ).subscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.syncRef();
  }

  ngOnDestroy() {
    this.$subscriber.next(true);
  }

  private syncRef () {
      if (typeof this.type === 'string') {
        this.ref = this.w.data().types.byUuid(this.type);

      } else {
        this.ref = this.type;
      }
  };

}
