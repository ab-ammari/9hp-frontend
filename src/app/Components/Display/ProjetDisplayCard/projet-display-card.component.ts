import {Component, Input, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ApiDbTable, ApiProjectIndex, ApiProjet, ApiSynchroFrontInterfaceEnum} from "../../../../../shared";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {combineLatest, first, Subject} from "rxjs";
import {filter, takeUntil, tap} from "rxjs/operators";
import {A} from "../../../Core-event";
import {DB} from "../../../Database/DB";
import {WorkerService} from "../../../services/worker.service";
import {LOG, LoggerContext, NetworkStatus} from "ngx-wcore";
import {DataActions} from "../../../../../shared/actions/data-actions";
import {ToastService} from "../../../services/toast.service";

const CONTEXT: LoggerContext = {
  origin: 'ProjetDisplayCardComponent'
}

@Component({
  selector: 'app-projet-display-card',
  templateUrl: './projet-display-card.component.html',
  styleUrls: ['./projet-display-card.component.scss']
})
export class ProjetDisplayCardComponent implements OnInit, OnDestroy {

  @Input() project: dbBoundObject<ApiProjet>;
  subscriber$ = new Subject();

  get isIndexed(): boolean{
    return !!this.index;
  };
  index?: ApiProjectIndex;
  items: number = 0;
  itemsInStore: number = 0;

  project_opening: boolean = false;
  project_loading: boolean = false;
  project_duplicating: boolean = false;
  DB = DB;

  constructor(
    public w: WorkerService,
    private zone: NgZone,
    private toast: ToastService
  ) {
  }


  ngOnInit(): void {
    LOG.debug.log({...CONTEXT, action: 'ngOnInit'});

    this.subscribeProject();

    DB.database.project_index.onIndexUpdate.pipe(
      takeUntil(this.subscriber$),
      tap((index) => {
        // LOG.debug.log({...CONTEXT, action: 'DB.database.project_index.onIndexUpdate.pipe'});
        this.checkifIndexed();
      })
    ).subscribe()
    this.checkifIndexed();
  }

  private subscribeProject() {
    this.project.onValueChange().pipe(
      takeUntil(this.subscriber$),
      tap(() => {
        this.checkifIndexed();
      })
    ).subscribe();
  }

  private checkifIndexed() {
    this.zone.run(() => {
      this.index = DB.database.project_index.index?.find(item => item.projet_uuid === this.project.item?.projet_uuid);
      if (this.index) {
        const ignored_tables = [ApiDbTable.type, ApiDbTable.projet, ApiDbTable.user_access, ApiDbTable.user, ApiDbTable.projet_user, ApiDbTable.type_category]
        const project_items = DB.database.project_index.index.find(item => item.projet_uuid === this.project.item?.projet_uuid).index
          .filter(obj => !ignored_tables.includes(obj.table));
        const unavailable_objects = this.w.data().objectsToFetch.filter(obj => {
          return (!ignored_tables.includes(obj.table) && obj.projet_uuid === this.project.item?.projet_uuid)
        });
        this.items = project_items.length;
        this.itemsInStore = this.items - unavailable_objects.length;

      } else {
        this.items = 0;
      }
    });
  }

  onViewProject(id: string) {
    this.project_opening = true;
    combineLatest([
      this.w.data().objects.onReady
        .pipe(
          filter((x) => x),
          first()
        ),
      this.w.data().projet.selected.select(id)
    ])
      .pipe(
        takeUntil(this.subscriber$),
        tap((value) => {
          this.w.trigger(A.requestNavigateTo,
            {
              location: ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_STATISTICS,
            });
          this.project_opening = false;
        })
      ).subscribe();
    this.w.network(DataActions.JOIN_PROJET, {projet_uuid: this.project.item.projet_uuid},
      {preferedNetwork: 'socket'}).subscribe(() => {
    });
  }

  ngOnDestroy() {
    this.subscriber$.next(undefined);
  }

  onEditProjet() {
    this.w.data().projet.selected.select(this.project.item.projet_uuid).subscribe(() => {
      this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_EDIT});
    });
  }

  onDuplicateProjet() {
    if (!this.project.item?.projet_uuid || this.project_duplicating) {
      return;
    }

    this.project_duplicating = true;
    this.w.network(DataActions.PROJET_DUPLICATE, {
      projet_uuid: this.project.item.projet_uuid
    }).subscribe({
      next: (value) => {
        const payload = (value as any)?.payload;
        const duplicateError = payload?.error?.length > 0 ? payload.error[0] : null;

        if (duplicateError) {
          const message = duplicateError?.error?.error?.message ?? 'Duplication impossible';
          this.toast.error('Erreur', message);
          this.project_duplicating = false;
          return;
        }

        this.toast.success('Succès', 'Projet dupliqué');
        this.w.network(DataActions.RETRIEVE_PROJETS, {}).subscribe({
          error: () => {
            this.toast.error('Erreur', 'Impossible de rafraîchir la liste des projets');
          }
        });
        this.project_duplicating = false;
      },
      error: () => {
        this.toast.error('Erreur', 'Duplication impossible');
        this.project_duplicating = false;
      }
    }).add(() => {
      this.project_duplicating = false;
    });
  }

  onLoadProjet() {
    const index: ApiProjectIndex = {
      index: [],
      projet_uuid: this.project.item.projet_uuid,
      amount_objects: 0,
      last_updated: 0
    };
    this.project_loading = true;
    DB.database.project_index.saveIndex([index]).pipe(
      tap(() => {
        this.checkifIndexed();
        if (this.w.networkStatus.socket === NetworkStatus.online) {
          this.w.network(DataActions.JOIN_PROJET, {projet_uuid: this.project.item.projet_uuid}, {preferedNetwork: 'socket'}).subscribe(() => {
            this.w.network(DataActions.RETRIEVE_PROJET_INDEX, {
              projets: [{
                projet_uuid: this.project.item.projet_uuid,
                last_synchro_ms: null,
              }],
              spam_me: false // Send data ASYNC with NOTIFY action
            }).subscribe({
              next: () => {
                this.project_loading = false
              },
              error: err => {
                this.project_loading = false;
              }
            });
          });
        } else {
          this.w.network(DataActions.RETRIEVE_PROJET_INDEX, {
            projets: [{
              projet_uuid: this.project.item.projet_uuid,
              last_synchro_ms: null,
            }],
            spam_me: false // Send data ASYNC with NOTIFY action
          }).subscribe({
            next: () => {
              this.project_loading = false
            },
            error: err => {
              this.project_loading = false;
            }
          });
        }

      })
    ).subscribe();

  }

  onClearIndex() {
    DB.database.project_index.clearIndex(this.project.item.projet_uuid).pipe(
      tap(() => {
        this.checkifIndexed();
      })
    ).subscribe();
  }

  onConfigProjet(projet_uuid: string | undefined) {
    this.w.data().projet.selected.select(projet_uuid).subscribe(() => {
      this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_CONFIGURATION})
    });
  }
}
