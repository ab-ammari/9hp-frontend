import {LOG, LoggerContext} from "ngx-wcore";
import {castorAbstractObjectDataClass} from "./models/castor-abstract-object-data-class";
import {ApiDbTable, ApiEnsemble} from "../../../shared";
import {DB} from "../Database/DB";

const CONTEXT: LoggerContext = {
  origin: 'EnsembleDataclass'
}

export class EnsembleDataclass extends castorAbstractObjectDataClass<ApiEnsemble> {
  get db() {
    return DB.database.ensemble;
  }

  constructor() {
    super(ApiDbTable.ensemble);
    LOG.debug.log({...CONTEXT});
  }

  setDefault() {
  }
}
