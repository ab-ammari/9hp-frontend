import {LOG, LoggerContext} from "ngx-wcore";
import {castorAbstractObjectDataClass} from "./models/castor-abstract-object-data-class";
import {ApiDbTable, ApiUs} from "../../../shared";
import {DB} from "../Database/DB";

const CONTEXT: LoggerContext = {
  origin: 'UsDataclass'
}

export class UsDataclass extends castorAbstractObjectDataClass<ApiUs>{

  get db() {
    return DB.database.us;
  }

  constructor(
  ) {
    super(ApiDbTable.us);
    LOG.debug.log({...CONTEXT});
  }

  setDefault() {
  }

}
