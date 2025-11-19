import {Injectable} from '@angular/core';
import {AbstractService, CoreModule, LOG, LoggerContext, Trigger} from "ngx-wcore";
import {WorkerService} from "../worker.service";
import {DataActions} from "../../../../shared/actions/data-actions";
import {ApiDbExchange, ApiDbTable, ApiProjet} from "../../../../shared";
import {DB} from "../../Database/DB";

const CONTEXT: LoggerContext = {
  origin: 'ProjetService'
}

@Injectable({
  providedIn: CoreModule
})
export class ProjetService extends AbstractService {

  constructor(protected w: WorkerService) {
    super(w);
    this.linkTriggers([
      new Trigger(DataActions.RETRIEVE_PROJETS, payload => this.insertProjects(payload.payload)),
    ]);

  }

  insertProjects(projets: Array<ApiDbExchange<ApiProjet>>) {
    projets.forEach(item => {
      const projet: ApiProjet = item.data;
      projet.draft = false;
      if (projet.config?.tags?.length > 0) {
        projet.config.tags = projet.config.tags.filter(tag => !tag.table_deprecated);
      }

      DB.database.projet.sync(item.data).subscribe({
        next: next => {
          LOG.debug.log({...CONTEXT, action: 'insertProjects'}, next);
        },
        error: err => {
          LOG.debug.log(err.message);
          if (err.message.includes('Key already exists in the object store')) {
            LOG.debug.log({...CONTEXT, action: 'Already exists'});
          } else {
            LOG.debug.log({...CONTEXT, action: 'DB.database.projet.sync'}, err);
          }
        }
      });
    });
  }
}


