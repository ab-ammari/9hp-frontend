import {LOG, LoggerContext} from "ngx-wcore";
import {ApiDbTable, ApiProjet} from "../../../shared";
import {DB} from "../Database/DB";
import {castorAbstractObjectDataClass} from "./models/castor-abstract-object-data-class";

const CONTEXT: LoggerContext = {
  origin: 'ProjetDataclass'
}

export class ProjetDataclass extends castorAbstractObjectDataClass<ApiProjet> {

  get db() {
    return DB.database.projet;
  }

  constructor() {
    super(ApiDbTable.projet);
    LOG.debug.log({...CONTEXT});
  }

  setDefault() {

  }
}

