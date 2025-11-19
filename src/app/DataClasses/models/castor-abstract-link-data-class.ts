import {ApiDbTable, ApiSyncableObject} from "../../../../shared";
import {Subject} from "rxjs";
import {LOG, LoggerContext} from "ngx-wcore";
import {DB, dbStatus} from "../../Database/DB";
import {filter, tap} from "rxjs/operators";
import {dbLink} from "../../Database/db-link";
import {dbBoundLink} from "./db-bound-link";
import {getTableDescription, tableDescription} from "./sync-obj-utilities";
import {dbBoundLinkList} from "./db-bound-link-list";

const CONTEXT: LoggerContext = {
  origin: 'castorAbstractLinkDataclass'
}

export abstract class castorAbstractLinkDataclass<T extends ApiSyncableObject> {

  all: dbBoundLinkList<T>;

  private $subscriber: Subject<boolean> = new Subject<boolean>();

  protected abstract get db(): dbLink<T>;

  public readonly info: tableDescription;

  protected constructor(protected table: ApiDbTable) {
    this.info = getTableDescription(table);
    DB.database.status.pipe(filter(value => value === dbStatus.ready)).subscribe(next => {
      this.init();
    });
  }

  private init() {
    this.$subscriber.next(undefined);
    this.all = new dbBoundLinkList<T>(this.db, this.info);
    LOG.debug.log({...CONTEXT, action: 'init'}, this.db, this.info);
    this.db.list().pipe(
      tap(value => {
        value.forEach(item => {

        })
      })
    ).subscribe();
    LOG.debug.log({...CONTEXT, action: 'init'}, this.db.table);
  }



}
