import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ApiBatchProjetIndexRequest,} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {DB} from "../../../Database/DB";
import {merge, Observable, Subject} from "rxjs";
import {takeUntil, tap} from "rxjs/operators";
import {LOG, LoggerContext} from "ngx-wcore";
import {DataActions} from "../../../../../shared/actions/data-actions";
import {A} from "../../../Core-event";
import {Manager} from "../../../util/utilitysingletons/activity-manager";

const CONTEXT: LoggerContext = {
  origin: 'CastorSynchroniserComponent'
}

@Component({
  selector: 'app-castor-synchroniser',
  templateUrl: './castor-synchroniser.component.html',
  styleUrls: ['./castor-synchroniser.component.scss']
})
export class CastorSynchroniserComponent implements OnInit, OnDestroy {

  private $subscriber: Subject<unknown> = new Subject<unknown>();

  constructor(
    public w: WorkerService,
    private zone: NgZone
  ) {
  }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.w.on(A.RequestInitProjectIndexed).pipe(
        takeUntil(this.$subscriber),
        tap(() => this.initProjectIndexed())
      ).subscribe();

      LOG.debug.log({...CONTEXT, action: 'ngOnInit', message: 'RETRIEVE_PROJETS'});


      this.initProjectIndexed();


      if (DB.database.project_index.isReady?.value) {
        this.initProjectIndexed(true);
      } else {
        DB.database.project_index.isReady.pipe(
          takeUntil(this.$subscriber),
          tap(() => {
            this.initProjectIndexed(true);
          })
        ).subscribe();
      }
    });

  }

  ngOnDestroy() {
    this.$subscriber.next(true);
  }

  initProjectIndexed(fullIndex: boolean = false) {
    if (DB.database.project_index?.index) {
      LOG.debug.log({...CONTEXT, action: 'initProjectIndexed'}, DB.database.project_index.index);
      const index_list: ApiBatchProjetIndexRequest = {
        projets: [],
        spam_me: false
      };
      DB.database.project_index.index.forEach(index => {
        index_list.projets.push({
          projet_uuid: index.projet_uuid,
          last_synchro_ms: fullIndex ? null : index.last_updated,
        });
      });
      if (index_list.projets.length > 0) {

        const subs: Array<Observable<any>> = [];
        index_list.projets.forEach(proj => {
          subs.push(this.w.network(DataActions.JOIN_PROJET, {projet_uuid: proj.projet_uuid}, {preferedNetwork: 'rest'}));
        });
        merge(subs).subscribe(() => {
          this.w.network(DataActions.RETRIEVE_PROJET_INDEX, index_list);
        });

      } else {
        LOG.debug.log({...CONTEXT, action: 'initProjectIndexed', message: 'no available index'}, index_list);
      }
    } else {
      LOG.warn.log({
        ...CONTEXT,
        action: 'initProjectIndexed',
        message: 'not available yet !'
      }, DB.database.project_index.index);
    }
  }


  protected readonly Manager = Manager;
}
