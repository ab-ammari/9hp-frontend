import {Component, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {WorkerService} from "../../../services/worker.service";
import {
  ApiDbExchanceStatus,
  ApiDbExchangeType,
  ApiProjet,
  ApiSynchroFrontInterfaceEnum,
  ApiUser
} from "../../../../../shared";
import {Subject} from "rxjs";
import {takeUntil, tap} from "rxjs/operators";
import {UserActions} from "../../../../../shared/actions/user-actions";
import {ApiProjetRoleEnum} from "../../../../../shared/objects/models/enums/ApiRole";
import {ActionSheetController, PopoverController} from "@ionic/angular";
import {DataActions} from "../../../../../shared/actions/data-actions";
import {LOG} from "ngx-wcore";
import {A} from "../../../Core-event";
import {DB} from "../../../Database/DB";

@Component({
  selector: 'app-project-configuration',
  templateUrl: './project-configuration.component.html',
  styleUrls: ['./project-configuration.component.scss']
})
export class ProjectConfigurationComponent implements OnInit, OnChanges {

  projet: ApiProjet;
  owner: ApiUser;
  users: Array<ApiUser>;

  $subscriber = new Subject();
  user_search_result: Array<ApiUser> = [];
  user_search: string;
  UserActions = UserActions;
  DataActions = DataActions;
  ApiProjetRoleEnum = ApiProjetRoleEnum;

  isConfigured: boolean = false;

  constructor(
    public w: WorkerService,
    private popover: PopoverController,
    private action: ActionSheetController
  ) {
  }

  ngOnInit(): void {
    this.w.data().projet.selected.onValueChange().pipe(
      takeUntil(this.$subscriber),
      tap(() => {
        this.init();
      })
    ).subscribe();
    this.w.on(UserActions.SEARCH_USER).pipe(takeUntil(this.$subscriber),
      tap((result) => {
        this.user_search_result = result.payload?.filter(user => !this.projet.users.some(u => user.user_uuid === u.user_uuid));
      })).subscribe();
    this.w.on(DataActions.RETRIEVE_PROJETS).pipe(
      takeUntil(this.$subscriber),
      tap(() => {
        this.init();
      })
    ).subscribe();

    this.w.on(UserActions.PROJET_USER).pipe(takeUntil(this.$subscriber),
      tap((result) => {
        if (result?.payload?.users) {
          this.projet.users = result.payload.users;
        }
        this.w.network(DataActions.RETRIEVE_PROJETS, {});
      })).subscribe();

    this.init();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.init();

  }

  init() {
    if (this.w.data().projet?.selected?.item) {
      this.projet = this.w.data().projet.selected.item;
      this.owner = this.projet.users.find(user => user.user_uuid === this.projet.owner_uuid);
      this.users = this.projet.users.filter(user => user.user_uuid !== this.projet.owner_uuid);
      this.isConfigured = this.projet.config.tags?.filter(tag => !tag.tag_config_default).length > 0;
    }
  }

  onSearch() {
    if (this.user_search?.length > 1) {
      this.w.network(UserActions.SEARCH_USER, {search: this.user_search.toLowerCase()});
    }
  }

  addUser(user: ApiUser) {
    this.w.network(UserActions.PROJET_USER, {
      user_uuid: user.user_uuid,
      role: ApiProjetRoleEnum.READ_AND_WRITE,
      access: 'ALLOW',
      projet_uuid: this.projet.projet_uuid
    }).pipe(
      tap(() => {
        this.user_search = null;
        this.popover.dismiss();
        this.init();
      })
    ).subscribe();
  }

  removeUser(user: ApiUser) {
    this.w.network(UserActions.PROJET_USER, {
      user_uuid: user.user_uuid,
      role: ApiProjetRoleEnum.READ,
      access: 'DENY',
      projet_uuid: this.projet.projet_uuid
    }).pipe(
      tap((result) => {
        this.init();
      })
    ).subscribe();
  }

  editUserAccess($event: any, user: ApiUser) {
    this.w.network(UserActions.PROJET_USER, {
      user_uuid: user.user_uuid,
      role: $event,
      access: 'ALLOW',
      projet_uuid: this.projet.projet_uuid
    }).pipe(
      tap((result) => {
        this.init();
      })
    ).subscribe();
  }

  async archiveProject() {

    const sheet = await this.action.create({
      header: 'Attention l\'action est definitive !',
      cssClass: 'my-custom-class',
      buttons: [{
        text: 'Archiver',
        role: 'destructive',
        icon: 'trash',
        id: 'delete-button',
        data: {
          type: 'delete'
        },
        handler: () => {
          console.log('Delete clicked');
          this.projet.live = false;
          this.w.network(DataActions.SYNC_OBJECT, {
            errorIfAlreadySave: true,
            list: [{
              action: ApiDbExchangeType.CREATE,
              status: ApiDbExchanceStatus.request,
              data: this.projet
            }]
          }).subscribe(value => {
            const error = value?.payload?.error?.length > 0 ? value?.payload?.error[0] : null;
            if (!error) {
              this.w.network(DataActions.RETRIEVE_PROJETS, {}).subscribe(() => {
                this.navigateToProjectList();
              });
            }
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

  get isReady(){
    return DB.database.isReady && this.w.data().types.list.length > 0;
  }

  navigateToProjectList() {
    this.w.data().projet.selected.select(null).subscribe(() => {
      this.w.trigger(A.requestNavigateTo, {location: ApiSynchroFrontInterfaceEnum.INTERFACE_PROJECT_LIST});
    });
  }

  protected readonly DB = DB;
}
