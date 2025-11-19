import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {
  ApiDbTable,
  ApiProjet,
  ApiSyncable,
  ApiSyncableObject,
  ApiSyncableType,
  ApiTypeCategory
} from "../../../../../../shared";
import {ToastService} from "../../../../services/toast.service";
import {DB, dbStatus} from "../../../../Database/DB";
import {WorkerService} from "../../../../services/worker.service";
import {Subject} from "rxjs";
import {debounceTime, filter, tap} from "rxjs/operators";
import {castor_standard_mobilier_materiaux_types} from "../../../../../../shared/objects/models/StandardTypes";
import {LOG, LoggerContext} from "ngx-wcore";
import {DEV} from "../../../../util/dev";
import {UI} from "../../../../util/ui";

const CONTEXT : LoggerContext = {
  origin: 'ProjectTypeConfigurationComponent'
}
interface Materiel {
  code: string;
  label: string;
  live: boolean;
  projet_uuid: string;
}

@Component({
  selector: 'app-project-type-configuration',
  templateUrl: './project-type-configuration.component.html',
  styleUrls: ['./project-type-configuration.component.scss']
})
export class ProjectTypeConfigurationComponent implements OnInit, OnDestroy {

  @Input() project: ApiProjet;

  material_list: Array<Materiel> = [];

  $subscriber = new Subject();
  constructor(private toast: ToastService, public w: WorkerService) { }

  ngOnDestroy() {
    this.$subscriber.next(null);
  }
  ngOnInit(): void {
    this.w.data().types.onInit().pipe(
      tap(() => {
        this.init();
      })
    ).subscribe();
  }

  init() {
    LOG.debug.log({...CONTEXT, action: 'init()'}, this.w.data().types.getByCategory(ApiTypeCategory.MOBILIER_MATERIAUX));
    this.material_list = this.w.data().types.getByCategory(ApiTypeCategory.MOBILIER_MATERIAUX).map(m => {
      return {
        code: m.type_prefix,
        label: m.type_label,
        live: true,
        projet_uuid: m.projet_uuid
      };
    });
    if (this.material_list.length === 0) {
      this.material_list = castor_standard_mobilier_materiaux_types.map(m => {
        return {
          code: m.type_prefix,
          label: m.type_label,
          live: false,
          projet_uuid: m.projet_uuid
        };
      });
    }
    this.material_list.sort((a,b) => a.code.localeCompare(b.code))

    LOG.debug.log({...CONTEXT, action: 'ngOnInit'}, this.material_list);
  }



  addMaterial(){
    this.material_list.push({
      code: '',
      label: '',
      live: false,
      projet_uuid: null
    });
  }

  remove(i: number) {
    this.material_list.splice(i, 1);
  }

  save() {
    if (this.material_list.some(m => !(m.code && m.label))){
      this.toast.error('missing code or label', 'Un matérial n\'a pas de code ou de label');
      return;
    }
    const projet_uuid = this.project.projet_uuid;
    if (!projet_uuid) {
      this.toast.error('missing Prpject info', 'Nous n\'avons pas pû determiner le projet');
      return;
    }
    const materiaux: Array<ApiSyncableType> = this.material_list
      .filter(m => !m.live)
      .map(m => {
      return {
        type_uuid: null,
        projet_uuid: this.project.projet_uuid,
        table: ApiDbTable.type,
        type_category_uuid: ApiTypeCategory.MOBILIER_MATERIAUX,
        type_prefix: m.code,
        type_label: m.label,
        draft: true,
      };
    });
  LOG.debug.log({...CONTEXT, action: 'attemting commit of : '}, materiaux);
    DB.database.type.commit(materiaux as ApiSyncable[] as ApiSyncableObject[]).pipe(
      tap(() => {
        this.w.data().types.init().pipe(
          tap(() => {
            this.init();
          })
        ).subscribe();
      })
    ).subscribe();


  }

  protected readonly DEV = DEV;
  protected readonly ApiTypeCategory = ApiTypeCategory;
  protected readonly UI = UI;
}
