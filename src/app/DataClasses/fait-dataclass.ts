import {LOG, LoggerContext} from "ngx-wcore";
import {castorAbstractObjectDataClass} from "./models/castor-abstract-object-data-class";
import {ApiDbTable, ApiFait, ApiSecteur, ApiSyncableObject} from "../../../shared";
import {DB} from "../Database/DB";

const CONTEXT: LoggerContext = {
  origin: 'FaitDataclass'
}

export class FaitDataclass extends castorAbstractObjectDataClass<ApiFait> {

  get db() {
    return DB.database.fait;
  }

  constructor(
  ) {
    super(ApiDbTable.fait);
    LOG.debug.log({...CONTEXT});
  }

  setDefault() {
  }
}
