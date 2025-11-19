import {LOG, LoggerContext} from "ngx-wcore";
import {ApiDbTable, ApiSecteur} from "../../../shared";
import {DB} from "../Database/DB";
import {castorAbstractObjectDataClass} from "./models/castor-abstract-object-data-class";

const CONTEXT: LoggerContext = {
  origin: 'SectorDataclass'
}

export class SectorDataclass extends castorAbstractObjectDataClass<ApiSecteur> {
  get db() {
    return DB.database.secteur;
  }

  constructor(
    ) {
    super(ApiDbTable.secteur);
    LOG.debug.log({...CONTEXT});
  }

  setDefault() {
  }


}
