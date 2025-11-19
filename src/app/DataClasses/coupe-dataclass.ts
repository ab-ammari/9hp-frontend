import {LOG, LoggerContext} from "ngx-wcore";
import {castorAbstractObjectDataClass} from "./models/castor-abstract-object-data-class";
import {ApiDbTable, ApiSectionCoupe} from "../../../shared";
import {DB} from "../Database/DB";
import {dbObject} from "../Database/db-object";

const CONTEXT: LoggerContext = {
  origin: 'CoupeDataclass'
}

export class CoupeDataclass extends castorAbstractObjectDataClass<ApiSectionCoupe> {
  get db() {
    return DB.database.section as dbObject<ApiSectionCoupe>;
  }

  constructor() {
    super(ApiDbTable.section_coupe);
    LOG.debug.log({...CONTEXT});
  }

  setDefault() {
  }
}
