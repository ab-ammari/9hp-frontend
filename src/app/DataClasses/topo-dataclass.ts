import {LOG, LoggerContext} from "ngx-wcore";
import {castorAbstractObjectDataClass} from "./models/castor-abstract-object-data-class";
import {ApiDbTable, ApiTopo} from "../../../shared";
import {DB} from "../Database/DB";

const CONTEXT: LoggerContext = {
  origin: 'TopoDataclass'
}

export class TopoDataclass extends castorAbstractObjectDataClass<ApiTopo> {
  get db() {
    return DB.database.topo;
  }

  constructor() {
    super(ApiDbTable.topo);
    LOG.debug.log({...CONTEXT});
  }

  setDefault() {
  }
}
