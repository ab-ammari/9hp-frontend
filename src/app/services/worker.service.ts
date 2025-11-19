import {Injectable} from '@angular/core';
import {LoggerContext, WorkerDataClass, WorkerServicePrototype} from "ngx-wcore";
import {RootDataClass} from "../RootDataClass";
import {ActionPrototype} from "wcore-shared";
import {DB} from "../Database/DB";
import {bulkCommitToDB} from "../Database/db-transactions";
import {ApiSyncableObject} from "../../../shared";
import {catchError, Observable, throwError} from "rxjs";
import {handleObjectUUID} from "../Database/db-utils";
import {v4 as uuidv4} from "uuid";
import {tap} from "rxjs/operators";

const CONTEXT: LoggerContext = {
  origin: 'WorkerService'
}

@Injectable({
  providedIn: 'root'
})
@WorkerDataClass(new RootDataClass())
export class WorkerService extends WorkerServicePrototype {


  constructor() {
    super();
  }

  data(): RootDataClass {
    return super.data() as RootDataClass;
  }

  db(): DB {
    return DB.database;
  }

  bulkCommit(objects: Array<ApiSyncableObject>): Observable<Array<ApiSyncableObject>>{
    return bulkCommitToDB(objects);
  }

  hasAnyActionsPending(): boolean {
    return this.networkActivity.length > 0;
  }

  hasAnyOfPending(actions: Array<ActionPrototype<unknown, unknown>>): boolean {
    return actions.some(item => this.networkActivity.includes(item.name()));
  }

  hasActionPending(action: ActionPrototype<unknown, unknown>): boolean {
    return this.networkActivity.includes(action.name());
  }


}

