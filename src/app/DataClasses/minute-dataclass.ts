import {LOG, LoggerContext} from "ngx-wcore";
import {castorAbstractObjectDataClass} from "./models/castor-abstract-object-data-class";
import {ApiDbTable, ApiDocumentMinute} from "../../../shared";
import {DB} from "../Database/DB";
import {dbObject} from "../Database/db-object";

const CONTEXT: LoggerContext = {
  origin: 'MinuteDataclass'
}

export class MinuteDataclass extends castorAbstractObjectDataClass<ApiDocumentMinute> {

  get db(): dbObject<ApiDocumentMinute> {
    return DB.database.document as dbObject<ApiDocumentMinute>;
  }

  constructor() {
    super( ApiDbTable.document_minute);
    LOG.debug.log({...CONTEXT});
  }

  setDefault() {
  }
}
