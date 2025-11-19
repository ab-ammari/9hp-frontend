import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {ApiProjet} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {ApiProjetRoleEnum} from "../../../../../shared/objects/models/enums/ApiRole";
import {NetworkManager} from "../../../util/network-manager";
import {Subject} from "rxjs";
import {takeUntil, tap} from "rxjs/operators";
import {DEV} from "../../../util/dev";
import {LOG, LoggerContext} from "ngx-wcore";


const CONTEXT: LoggerContext = {
  origin: 'AccessGuardComponent'
}

@Component({
  selector: 'app-access-guard',
  templateUrl: './access-guard.component.html',
  styleUrls: ['./access-guard.component.scss']
})
export class AccessGuardComponent implements OnInit, OnChanges, OnDestroy {

  @Input() project: ApiProjet = this.w.data().projet.selected.item;

  @Input() onlineOnly: boolean = false;
  @Input() ownerOnly: boolean = false;
  @Input() writeOnly: boolean = false;
  @Input() configuredOnly: boolean = false;
  @Input() preConfiguredOnly: boolean = false;

  @Input() customProtection: string;


  get isOnline(): boolean {
    return this.w.data().status.online;
  }

  canWrite: boolean = false;
  private _isProtected: boolean = true;
  get isProtected(): boolean {
    return this._isProtected && !DEV.tools.isDevMode;
  }
  isConfigured: boolean = false;

  $subscriber: Subject<any> = new Subject<unknown>();

  constructor(
    public w: WorkerService
  ) {
  }

  ngOnInit(): void {
    NetworkManager.status_observer.pipe(
      takeUntil(this.$subscriber),
      tap(() => this.init())
    ).subscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.init();
  }

  ngOnDestroy() {
    this.$subscriber.next(true);
  }

  private init() {

    this.canWrite = [ApiProjetRoleEnum.AUTHOR, ApiProjetRoleEnum.READ_AND_WRITE].includes(this.project?.users?.find(user => user.user_uuid === this.w.data().user.user_uuid)?.projet_role);
    this.isConfigured = this.project?.config?.tags?.filter(tag => !tag.tag_config_default).length > 0;

    if (!this.project) {
      this._isProtected = true;
    } else if (this.onlineOnly && !this.isOnline) {
      this._isProtected = true;
    } else if (this.configuredOnly && !this.isConfigured) {
      this._isProtected = true;
    } else if (this.ownerOnly && this.project.owner_uuid !== this.w.data().user.user_uuid) {
      this._isProtected = true;
    } else if (this.configuredOnly && !this.isConfigured) {
      this._isProtected = true;
    } else if (this.preConfiguredOnly && this.isConfigured) {
      this._isProtected = true;
    } else if (this.customProtection) {
      this._isProtected = true;
    } else {
      this._isProtected = (this.writeOnly && !this.canWrite);
    }
      LOG.debug.log({...CONTEXT, action: 'init'}, this._isProtected, this.project, this.isConfigured, this.preConfiguredOnly);
  }

  protected readonly DEV = DEV;
}
