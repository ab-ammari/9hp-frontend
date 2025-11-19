import {Abstractdb} from "./abstractdb";
import {Table} from "dexie";
import {ApiProjectIndex, ApiUser} from "../../../shared";
import {LOG, LoggerContext} from "ngx-wcore";
import {session_schema} from "./schema";

const CONTEXT: LoggerContext = {
  origin: 'Sessiondb'
}

export class Sessiondb extends Abstractdb {
  /**
   * Tables
   */
  user: Table<ApiUser, string>; // user_uuid
  projet_index: Table<ApiProjectIndex, string>; //projet_uuid


  constructor(DbName: string) {
    super(DbName);
    LOG.debug.log({...CONTEXT, action: 'Castordb:::constructor'});
    this.setup();
    this.open();
  }

  private setup() {
    this.version(1).stores(session_schema);
  }
}
