import {LOG, LoggerContext} from "ngx-wcore";
import {castorAbstractObjectDataClass} from "./models/castor-abstract-object-data-class";
import {ApiContenant, ApiDbTable, ApiSyncableObject} from "../../../shared";
import {DB} from "../Database/DB";

const CONTEXT: LoggerContext = {
  origin: 'ContenantDataclass'
}

export class ContenantDataclass extends castorAbstractObjectDataClass<ApiContenant>{

  get db() {
    return DB.database.contenant;
  }

  constructor(
  ) {
    super(ApiDbTable.contenant);
    LOG.debug.log({...CONTEXT});
  }

  setDefault() {
  }
}
