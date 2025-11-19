import {ApiDbTable, ApiTopo, TagSystem} from "../../../shared";
import {Observable, of} from "rxjs";

export class CastorDataValidation {


  validateTopo(object: ApiTopo, previous_version: ApiTopo, system: TagSystem) {
    switch (system) {
      case TagSystem.FAIT:
        if (
          !object.fait_uuid
          ||
          (previous_version && previous_version.fait_uuid !== object.fait_uuid)
        ){
          return false;
        }
        break;
      case TagSystem.SECTEUR:

    }
    return  true;
  }

  static tagSystemValidation(object: unknown, previous_version: unknown, table: ApiDbTable, system: TagSystem): Observable<boolean> {
    switch (table) {
      case ApiDbTable.contenant:
        return of(true);
      default:
        return of(true);
    }

  }

}
