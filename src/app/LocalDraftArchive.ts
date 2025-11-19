import {ApiDbExchanceStatus, ApiDbExchange, ApiDbExchangeType, ApiDbTable, ApiSyncable} from "../../shared";
import {of, timer} from "rxjs";
import {debounceTime, filter, tap} from "rxjs/operators";
import {DB, dbStatus} from "./Database/DB";
import {LOG, LoggerContext} from "ngx-wcore";
import {Transaction} from "dexie";

const CONTEXT : LoggerContext = {
  origin: 'LocalDraftArchive'
}

export class LocalDraftArchive {
  private locks: Map<ApiDbTable, { baseline: number, triggerCount: number; timer: number }> = new Map<ApiDbTable, {
    baseline: number,
    triggerCount: number;
    timer: number
  }>();
  private archive: Array<ApiDbExchange<ApiSyncable>> = []; // local drafts not yet registered in backend
  private ongoing: Map<number, number> = new Map<number, number>();

  private _total: number = 0;
  private _initial_total: number = 0;
  private _pending: number = 0;
  private _errored: number = 0;
  private _locked: number = 0;
  private _validated: number = 0;
  private _lockedTableList: Array<ApiDbTable> = [];

get lockedTableList() {
  return this._lockedTableList;
}
  get lockedTables() {
    return this.locks.size;
  }
  get locked() {
    return this._locked;
  }

  get total() {
    return this._total;
  }
  get validated() {
    return this._validated;
  }

  get initialTotal() {
    return this._initial_total;
  }

  get errored() {
    return this._errored;
  }

  get pending() {
    return this._pending;
  }

  loading: boolean = true;

  constructor() {
    const ticktime: number = 1000;
    timer(0, ticktime).pipe(
      tap(() => {
        this._total = this.archive.length;
        this._errored = this.archive.filter(item => {
          return item.data.error?.length > 0 || this.locks.has(item.data.table)
        }).length;
        const time = new Date().getTime();
        this.ongoing.forEach((created, ref_time) => {
          if (time - ref_time > 10000) {
            this.ongoing.delete(created);
          }
        });
        this._locked = this.archive.filter(obj => this.locks.has(obj.data.table)).length;
        this._pending = this.archive.filter(a => {
          return !this.locks.has(a.data.table)
            && !this.ongoing.has(a.data.created)
            && !a.data.error?.length
        }).length;
      }),
      filter(() => this.locks.size > 0),
      tap(() => {
        this.locks.forEach((value, key) => {
          if (value.timer < ticktime) {
            this.locks.delete(key);
          } else {
            this.locks.set(key, {
              ...value,
              timer: value.timer - 1000,
            });
          }
        });
        const list = [];
        this.locks.forEach((lock, key) => {
          list.push(key);
        });
        this._lockedTableList = list;
      })
    ).subscribe();
    DB.database.status.pipe(
      filter(status => status === dbStatus.ready),
      tap((status) => {
          this.fetchDrafts();
    })).subscribe();
  }

  private async fetchDrafts() {
  const stores = DB.database.castor_db_list.filter(x => x);
  LOG.debug.log({...CONTEXT, action: ''}, stores);
    const drafts = await DB.database.executeReadOnlyTransaction(
      async (transaction: Transaction) => {
        const drafts = await Promise.all(stores.map(table => {
          LOG.debug.log({...CONTEXT, action: 'getting table values for '}, table.name);
            const result = table.filter(x => x.draft).toArray() as Promise<Array<ApiSyncable>>;
          return result;
        }));
        return drafts.flat();
      }, stores
    );
    this.add(drafts);
  }

  next(count: number = 1) {
    if ( count && count > 0) {
        this.archive.sort((val1, val2) => val1.data.created - val2.data.created);

      const next_list = this.archive.map(
        (value, index, array) => {
        if (!this.locks.has(value.data.table)
          && !this.ongoing.has(value.data.created)
          && !value.data.error?.length) {
          return value;
        } else {
          return null;
        }
      }).filter(x => x).slice(0, count);

      next_list.forEach(item => {
        this.ongoing.set(item.data.created, new Date().getTime());
      })
      return next_list;

    } else {
      LOG.error.log({...CONTEXT, action: 'next('}, count);
      throw('Missing count');
    }

  }

  lockTable(table: ApiDbTable) {
    if (this.locks.has(table)) {
      const lock = this.locks.get(table);
      this.locks.set(table, {
        ...lock,
        triggerCount: lock.triggerCount++,
        timer: lock.timer + (lock.baseline * lock.triggerCount * 2)
      });
    } else {
      const baseline = 60000;
      this.locks.set(table, {
        baseline: baseline,
        triggerCount: 1,
        timer: baseline
      });
    }

  }

  validate(items: ApiSyncable[], success: boolean = true) {
    items.forEach(item => {
      const index = this.archive.findIndex(a => a.data.created === item.created);
      this.ongoing.delete(item.created);
      if (success) {
        this.archive.splice(index, 1);
        this.locks.delete(item.table);
        this._validated++;
      }
    });
  }

  add(drafts: Array<ApiSyncable>) {
    drafts.forEach(draft => {
      const index = this.archive.findIndex(obj => obj.data.created === draft.created);
      if (index === -1) {
        this.archive.push({
          data: draft,
          action: ApiDbExchangeType.CREATE,
          status: ApiDbExchanceStatus.request
        });
        this._initial_total++;
        this._total++;
      } else {
        // already is in list
        this.archive[index] = {
          data: draft,
          action: ApiDbExchangeType.CREATE,
          status: ApiDbExchanceStatus.request
        };
      }

    });
    this.loading = false;
  }

}
