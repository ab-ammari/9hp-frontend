import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Subscription} from "rxjs";
import {WorkerService} from "../../../services/worker.service";
import {A} from "../../../Core-event";
import {
  ApiDbExchanceStatus,
  ApiDbExchangeType,
  ApiDbTable,
  ApiProjet,
  ApiSynchroFrontInterfaceEnum
} from "../../../../../shared";
import {LOG, LoggerContext} from "ngx-wcore";
import {DataActions} from "../../../../../shared/actions/data-actions";
import {v4} from "uuid";
import {ToastService} from "../../../services/toast.service";

const CONTEXT: LoggerContext = {
  origin: 'ProjetFormComponent'
}

@Component({
  selector: 'app-projet-form',
  templateUrl: './projet-form.component.html',
  styleUrls: ['./projet-form.component.scss']
})
export class ProjetFormComponent implements OnInit, OnDestroy {

  @Input() projectToModify: ApiProjet;

  projetForm = new UntypedFormGroup({});

  mailSubscription = new Subscription();

  typeSelectionArray = ['Fouille programmée', 'Fouille préventive', 'Diagnostic', 'Autre']
  DataActions = DataActions;

  constructor(private formBuilder: UntypedFormBuilder,
              private toast: ToastService,
              public w: WorkerService) {
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.projetForm = this.formBuilder.group({
      name: [this.projectToModify?.projet_label ?? '', Validators.required],
      status: this.projectToModify?.status ?? '',
      commune: [this.projectToModify?.commune ?? '', Validators.required],
      lieu_dit: [this.projectToModify?.lieu_dit ?? '', Validators.required],
      annee: [this.projectToModify?.projet_years ?? '', Validators.required],
      type: this.projectToModify?.type ?? '',
      operateur: this.projectToModify?.operateur ?? '',
      write_lock_enabled: this.projectToModify?.write_lock_enabled ?? false,
    });

  }

  onSaveProjet() {
    if (this.w.data()?.user?.user_uuid) {
      this.saveFormValue(this.w.data().user.user_uuid);
    } else {
      LOG.debug.log({...CONTEXT, action: 'onSaveProjet'});
    }
  }

  saveFormValue(owner_uuid: string) {
    LOG.debug.log({...CONTEXT, action: 'saveFormValue'}, owner_uuid);

    const formValue = this.projetForm.value;
    if (this.projectToModify) {
      this.projectToModify.commune = formValue['commune'];
      this.projectToModify.lieu_dit = formValue['lieu_dit'];
      this.projectToModify.projet_years = formValue['annee'];
      this.projectToModify.type = formValue['type'];
      this.projectToModify.operateur = formValue['operateur'];
      this.projectToModify.projet_label = formValue['name'];
      this.projectToModify.write_lock_enabled = formValue['write_lock_enabled'];
      this.projectToModify.created = Date.now();
      this.projectToModify.author_uuid = this.w.data().user.user_uuid;
      this.saveUpdateProject(this.projectToModify);
    } else {

      LOG.debug.log({...CONTEXT, action: 'saveFormValue:: is create mode'}, owner_uuid);
      const newProject: ApiProjet = {
        config: null,
        write_lock_enabled: !!formValue['write_lock_enabled'],
        table: ApiDbTable.projet,
        commune: formValue['commune'],
        lieu_dit: formValue['lieu_dit'],
        projet_years: formValue['annee'],
        operateur: formValue['operateur'],
        type: formValue['type'],
        created: Date.now(),
        live: true,
        versions: null,
        projet_uuid: v4(),
        projet_label: formValue['name'],
        owner_uuid: owner_uuid,
        users: [],
        author_uuid: this.w.data().user.user_uuid
      }
      this.saveUpdateProject(newProject);
    }
  }

  saveUpdateProject(project: ApiProjet) {
    LOG.debug.log({...CONTEXT, action: 'saveUpdateProject'}, project);
    this.w.network(DataActions.SYNC_OBJECT, {
      errorIfAlreadySave: true,
      list: [{
        action: ApiDbExchangeType.CREATE,
        status: ApiDbExchanceStatus.request,
        data: project
      }]
    }).subscribe(value => {
      LOG.debug.log({...CONTEXT, action: 'saveUpdateProject'}, project);
      const error = value?.payload?.error?.length > 0 ? value?.payload?.error[0] : null;
      if (error) {
        if (error.error?.error?.code) {
          this.toast.error(error.error.error.code, error.error.error.message);
        } else {
          this.toast.error('Erreur', 'inconnu');
        }
      } else {
        this.w.network(DataActions.RETRIEVE_PROJETS, {}).subscribe(() => {
          this.navigateToProjectList();
        });
      }
    });
  }

  navigateToProjectList() {
    this.w.data().projet.selected.select(null).subscribe(() => {
      this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_LIST});
    });
  }

  onBack() {
    this.navigateToProjectList();
  }

  ngOnDestroy() {
    this.mailSubscription.unsubscribe();
  }
}
