import {Table} from "dexie";
import {BehaviorSubject, forkJoin, Observable, timer} from "rxjs";
import {observe, triggerChangeDetection} from "../util/utils";
import {debounce, filter, share, switchMap, tap} from "rxjs/operators";
import {DB, dbStatus} from "./DB";
import {ApiDbTable, ApiProjectIndex, ApiSyncableObjectIndex} from "../../../shared";
import {LOG, LoggerContext} from "ngx-wcore";

const CONTEXT: LoggerContext = {
  origin: 'ProjectIndexStore'
}

export class ProjectIndexStore {
  get index(): Array<ApiProjectIndex> {
    return this._index.value;
  }

  get onIndexUpdate(): Observable<Array<ApiProjectIndex>> {
    return this._index.asObservable().pipe(share());
  }

  isReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private _index: BehaviorSubject<Array<ApiProjectIndex>> = new BehaviorSubject<Array<ApiProjectIndex>>(null);

  constructor(private db_table: Table<ApiProjectIndex, string>) {
    this._index.pipe(
      debounce(() => timer(500))
    ).subscribe(() => triggerChangeDetection());
    DB.database.status.pipe(filter(x => x === dbStatus.ready)).subscribe(() => {
      this.retrieveDBIndex();
    });
    this.retrieveDBIndex();
    DB.database.on_change.pipe(
      filter((value) => value.table === db_table.name),
      debounce(() => timer(100)),
      tap(
        (value) => {
          if (value.table === db_table.name) {
            this.retrieveDBIndex();
          }
        }
      )).subscribe()
  }

  private retrieveDBIndex() {
    observe(this.db_table.toArray()).pipe(
      tap(value => {
        this._index.next(value);
        if (!this.isReady.value) {
          this.isReady.next(true);
        }
      })
    ).subscribe();
  }

  markRecordAsCorrupted(index: ApiSyncableObjectIndex, error: unknown): Observable<unknown> {
    return observe(this.db_table.get(index.projet_uuid)).pipe(
      switchMap((record) => {
        if (!record) {
          throw Error('missing record');
        }
        const i = record.index.findIndex(x => x.key === index.key && x.value === index.value && x.created === index.created);
        index.error = error;
        if (i !== -1) {
          record.index[i] = index;
        } else {
          record.index.push(index);
        }
        return observe(this.db_table.put(record));
      })
    );
  }


  saveIndex(indexes: Array<ApiProjectIndex>): Observable<unknown> {
    const subs: Array<Observable<unknown>> = [];
    indexes.forEach(index => {
      subs.push(observe(this.db_table.get(index.projet_uuid)).pipe(
        switchMap((value, i) => {
          // LOG.debug.log({...CONTEXT, action: 'saveIndex switchMap'}, value, i, index);

          if (value && index && value.projet_uuid === index.projet_uuid) {
                LOG.debug.log({...CONTEXT, action: 'saveIndex update'}, value, index);
            // merge Arrays
            const newIndex: Array<ApiSyncableObjectIndex> = value.index;
            index.index.forEach(item => {
              if (newIndex.some(x => x.key === item.key && x.value === item.value && x.created === item.created)) {
                // ignore. already exists in local index
             //   LOG.debug.log({...CONTEXT, action: 'saveIndex update', message: 'ignore. already exists in local index'}, item);
              } else {
                newIndex.push(item);
              }
            });
            LOG.debug.log({...CONTEXT, action: 'saveIndex update', message: 'newIndex filled'}, newIndex);

            if (newIndex.length < index.index?.length) {
              LOG.warn.log({
                ...CONTEXT,
                action: 'saveIndex',
                message: 'there seeems to be an issue with missing indexes !'
              }, newIndex?.length, index?.index?.length);
            }

            return observe(this.db_table.update(index.projet_uuid, {
              index: newIndex,
              amount_objects: index.amount_objects,
              last_updated: index.last_updated
            })).pipe(tap((result) => {
              //   LOG.debug.log({...CONTEXT, action: 'saveIndex update Result'}, result);
            }));
          } else { // index doesn't exist yet
            // LOG.debug.log({...CONTEXT, action: 'saveIndex add'}, value, index);
            return observe(this.db_table.add(index));
          }
        }), share()));
    });

    return forkJoin(subs).pipe(tap(() => this.retrieveDBIndex()));

  }

  clearIndex(uuid: string): Observable<void> {
    return observe(this.db_table.delete(uuid)).pipe(tap(() => {
      [...DB.database.object_table_list.filter(t => t.name !== ApiDbTable.projet), ...DB.database.link_table_List].forEach(table => {
        table.where({projet_uuid: uuid}).filter(x => !x.draft).delete().then((count) => {
          LOG.info.log({...CONTEXT, action: table.name, message: 'objects deleted:'}, count);
        });
      });
      this.retrieveDBIndex()
    }));
  }

}
