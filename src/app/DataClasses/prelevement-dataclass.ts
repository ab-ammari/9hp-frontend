import {LOG, LoggerContext} from "ngx-wcore";
import {castorAbstractObjectDataClass} from "./models/castor-abstract-object-data-class";
import {ApiDbTable, ApiEchantillonPrelevement} from "../../../shared";
import {dbObject} from "../Database/db-object";
import {DB} from "../Database/DB";

const CONTEXT: LoggerContext = {
  origin: 'PrelevementDataclass'
}

export class PrelevementDataclass extends castorAbstractObjectDataClass<ApiEchantillonPrelevement> {

  get db(): dbObject<ApiEchantillonPrelevement> {
    return DB.database.echantillon as dbObject<ApiEchantillonPrelevement>;
  }

  constructor() {
    super(ApiDbTable.echantillon_prelevement);
    LOG.debug.log({...CONTEXT});
  }

  setDefault() {
  }
}
