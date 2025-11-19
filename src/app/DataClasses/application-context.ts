import {LinkSelection} from "../services/castor-object-context.service";


export interface CastorGlobalScope {
  documents: Array<string>;
}
export class ApplicationContext {

  linkSelection: LinkSelection = {id: "details", label: 'details', info: null, type: null};

  scope: CastorGlobalScope = {
    documents: []
  };


  constructor() {

  }

}
