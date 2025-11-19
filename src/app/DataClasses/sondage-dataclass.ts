import {LOG, LoggerContext} from "ngx-wcore";
import {castorAbstractObjectDataClass} from "./models/castor-abstract-object-data-class";
import {ApiDbTable, ApiSection, ApiSectionSondage} from "../../../shared";
import {DB} from "../Database/DB";
import {dbObject} from "../Database/db-object";

const CONTEXT: LoggerContext = {
  origin: 'SondageDataclass'
}

export class SondageDataclass extends castorAbstractObjectDataClass<ApiSectionSondage> {
  get db() {
    return DB.database.section as dbObject<ApiSectionSondage>;
  }

  constructor() {
    super(ApiDbTable.section_sondage);
    LOG.debug.log({...CONTEXT});
  }

  setDefault() {
  }
}
