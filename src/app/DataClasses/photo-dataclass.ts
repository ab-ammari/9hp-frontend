import {LOG, LoggerContext} from "ngx-wcore";
import {castorAbstractObjectDataClass} from "./models/castor-abstract-object-data-class";
import {ApiDbTable, ApiDocumentPhoto} from "../../../shared";
import {dbObject} from "../Database/db-object";
import {DB} from "../Database/DB";

const CONTEXT: LoggerContext = {
  origin: 'PhotoDataclass'
}

export class PhotoDataclass extends castorAbstractObjectDataClass<ApiDocumentPhoto> {

  get db(): dbObject<ApiDocumentPhoto> {
    return  DB.database.document as dbObject<ApiDocumentPhoto>;
  }

  constructor() {
    super( ApiDbTable.document_photo);
    LOG.debug.log({...CONTEXT});
  }

  setDefault() {
  }
}
