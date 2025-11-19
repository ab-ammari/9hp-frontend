import {LOG, LoggerContext} from "ngx-wcore";
import {castorAbstractObjectDataClass} from "./models/castor-abstract-object-data-class";
import {ApiDbTable, ApiEchantillonMobilier} from "../../../shared";
import {DB} from "../Database/DB";
import {dbObject} from "../Database/db-object";

const CONTEXT: LoggerContext = {
  origin: 'MobilierDataclass'
}

export class MobilierDataclass extends castorAbstractObjectDataClass<ApiEchantillonMobilier> {


  get db(): dbObject<ApiEchantillonMobilier>{
    return DB.database.echantillon as dbObject<ApiEchantillonMobilier>;
  }


  constructor() {
    super( ApiDbTable.echantillon_mobilier);
    LOG.debug.log({...CONTEXT});
  }

  setDefault() {
  }

}
