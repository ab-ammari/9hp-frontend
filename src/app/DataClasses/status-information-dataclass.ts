import {LOG, LoggerContext} from "ngx-wcore";


const CONTEXT: LoggerContext = {
  origin: 'StatusInformationDataclass'
}

export class StatusInformationDataclass {

  syncStatus: 'run' | 'pause' = 'run';

  online: boolean = false;

  tokenstatus: boolean = true;

  constructor() {
    LOG.debug.log({...CONTEXT});
    this.setDefault();

  }

  setDefault() {
    this.online = false;
    this.tokenstatus = true;
  }

}
