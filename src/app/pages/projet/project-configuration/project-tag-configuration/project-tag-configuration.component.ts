import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiConfig, ApiDbTable, ApiProjet, ApiSynchroFrontInterfaceEnum, TagSystem} from "../../../../../../shared";
import {WorkerService} from "../../../../services/worker.service";
import {DataActions} from "../../../../../../shared/actions/data-actions";
import {ActionSheetController} from "@ionic/angular";
import {tap} from "rxjs/operators";
import {Action} from "rxjs/internal/scheduler/Action";
import {ActionIQ, ActionPrototype} from "wcore-shared";
import {A} from "../../../../Core-event";

@Component({
  selector: 'app-project-tag-configuration',
  templateUrl: './project-tag-configuration.component.html',
  styleUrls: ['./project-tag-configuration.component.scss']
})
export class ProjectTagConfigurationComponent implements OnInit, OnChanges {

  @Input() project: ApiProjet;
  config: ApiConfig;
  TagSystem = TagSystem;
  DataActions = DataActions;

  ApiDbTable = ApiDbTable;



  constructor(
    public w: WorkerService,
    private action: ActionSheetController
  ) {
  }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.init();
  }

  init() {
    if (this.project) {
      this.config = this.project.config;
    }
  }

  getEnumLabel(sys: TagSystem){

    switch (sys) {
      case TagSystem.SECTEUR:
        return 'Incrémentation par secteur';
      case TagSystem.PSEUDO_SYSLAT:
        return 'Pseudo syslat';
      case TagSystem.MOBILIER_US:
        return 'Incrémentation par US';
      case TagSystem.MOBILIER_US_MATERIAU:
        return 'Incrémentation par US et matériau';
      case TagSystem.MOBILIER_MATERIAU:
        return 'Incrémentation par matériau';
      case TagSystem.MOBILIER_MATERIAU_US:
        return 'Incrémentation par matériau et US';
      case TagSystem.PRELEVEMENT_US:
        return 'Incrémentation par US';
      case TagSystem.PRELEVEMENT_NATURE:
        return 'Incrémentation par nature';
      case TagSystem.PRELEVEMENT_US_NATURE:
        return 'Incrémentation par US et nature';
      case TagSystem.PRELEVEMENT_NATURE_US:
        return 'Incrémentation par nature et US';
      case TagSystem.CONTINUE:
        return 'Incrémentation continue';
      case TagSystem.FAIT:
        return 'Incrémentation par fait';
    }
  }
  async saveTags() {

    const sheet = await this.action.create({
      header: 'Attention l\'action n\'est possible qu\'une seule fois !',
      cssClass: 'my-custom-class',
      buttons: [{
        text: 'Enregistrer',
        role: 'destructive',
        icon: 'save',
        id: 'delete-button',
        data: {
          type: 'delete'
        },
        handler: () => {
          console.log('Delete clicked');
          this.w.network(DataActions.PROJET_UPDATE_CONFIG, {
            projet_uuid: this.project.projet_uuid,
            config: this.config
          }).subscribe(() => {
            this.w.network(DataActions.RETRIEVE_PROJETS, {});
          });
        }
      }, {
        text: 'Annuler',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
        }
      }]
    });
    sheet.present();


  }
}
