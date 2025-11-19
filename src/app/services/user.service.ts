import {Injectable} from "@angular/core";
import {AuthService} from "@auth0/auth0-angular";
import {WorkerService} from "./worker.service";
import {LOG, LoggerContext, SystemActions} from "ngx-wcore";
import {UI} from "../util/ui";
import {ConfigurationService} from "./configuration.service";
import {filter, tap} from "rxjs/operators";
import {DB} from "../Database/DB";
import {ApiError} from "wcore-shared";
import {AlertController} from "@ionic/angular";

const CONTEXT: LoggerContext = {
  origin: 'UserService'
}

@Injectable()
export class UserService {
  profileJson = '';
  userId!: number;
  user: any;

  alert: HTMLIonAlertElement;


  constructor(public auth: AuthService,
              private config: ConfigurationService,
              public alertController: AlertController,
              private w: WorkerService) {
    this.w.on(SystemActions.NETWORK_ERROR).pipe(
      tap((value) => {
        LOG.debug.log({...CONTEXT, action: 'SystemActions.NETWORK_ERROR'}, value);
        switch ((value as ApiError)?.error?.code) {
          case 'ERR-0331':
            this.auth.idTokenClaims$.subscribe((claims) => {
              LOG.info.log({...CONTEXT, action: 'idTokenClaims$'}, claims);
              if (claims) {
                this.config.initBackend(claims.__raw).pipe(
                  tap((iq) => {
                    if (iq.payload.user.user_uuid) {
                      this.setUser(iq.payload.user.user_uuid);
                    }
                  })
                ).subscribe();
              } else {
                LOG.info.log({...CONTEXT, action: 'no available claim idTokenClaims$'}, claims);
                this.UserTokenExpiredAlert();
              }
            });
            break;
        }

      })
    ).subscribe();
  }

  authUser() {
    LOG.debug.log({...CONTEXT, action: 'authUser()'}, JSON.stringify(this.w.data().status));
    if (this.w.data().status.online) {
      LOG.debug.log({...CONTEXT, action: 'authUser()', message: ' -> is Online'}, this.w.data().status);

      this.auth.user$.pipe(tap((profile) => {
        LOG.debug.log({...CONTEXT, action: 'authUser()', message: 'this.auth.user$.pipe(tap('}, profile);

        if (profile?.sub) {
          LOG.info.log({...CONTEXT, action: 'this.auth.user$'}, profile);
        } else {
          LOG.info.log({...CONTEXT, action: 'this.auth.user$'}, profile);
        }
      })).subscribe({
          error: err => {
            LOG.info.log({...CONTEXT, action: 'this.auth.user$', message: 'error : '}, err);
          }
        }
      );

      this.auth.idTokenClaims$.subscribe({
        error: (err) => {
          LOG.info.log({...CONTEXT, action: 'idTokenClaims$', message: 'error'}, err);

        },
        next: (claims) => {
          LOG.info.log({...CONTEXT, action: 'idTokenClaims$'}, claims);
          if (claims) {
            this.config.initBackend(claims.__raw).pipe(
              tap((iq) => {
                if (iq.payload.user.user_uuid) {
                  this.setUser(iq.payload.user.user_uuid);
                }
              })
            ).subscribe(
            );
          } else {
            LOG.info.log({...CONTEXT, action: 'no available claim idTokenClaims$'}, claims);
          }
        }
      });
    } else if (UI.state.store.us_uuid) {
      LOG.debug.log({...CONTEXT, action: 'attemotig to set locally set User with uuid: '}, UI.state.store.us_uuid);
      this.setUser(UI.state.store.us_uuid);
    } else {
      LOG.debug.log({...CONTEXT, action: 'no uuid available. What do ????'}, UI.state.store.us_uuid, this.w.data().status);
    }
  }

  private async UserTokenExpiredAlert() {
    if (this.w.data().status.tokenstatus) {
      this.w.data().status.tokenstatus = false;

      this.alert = await this.alertController.create({
        id: 'UserTokenExpiredAlert',
        cssClass: 'my-custom-class',
        header: 'Confirm!',
        message: 'Votre token a expiré. Si possible reconnectez vous !',
        buttons: [
          {
            text: 'Continuer en hors ligne',
            role: 'cancel',
            cssClass: 'secondary',
            id: 'cancel-button',
            handler: (blah) => {
              console.log('Confirm Cancel: blah');
            }
          }, {
            text: 'Reconnexion',
            id: 'confirm-button',
            handler: () => {
              console.log('Confirm Okay');
              this.logout();
            }
          }
        ]
      });
      this.alert.onDidDismiss().finally(() => {
        this.w.data().status.tokenstatus = true;
      });

      await this.alert.present();
    }
  }

  setUser(uuid: string) {
    if (uuid) {
      if (DB.database.user_session.readyState.value) {
        const user = DB.database.user_session.user;
        LOG.debug.log({...CONTEXT, action: 'setUser', message: 'Save new User'}, user);
        this.w.data().user = user;
      } else {
        DB.database.user_session.readyState.pipe(
          filter(value => value),
          tap(() => {
            const user = DB.database.user_session.user;
            LOG.debug.log({...CONTEXT, action: 'setUser', message: 'Save new User'}, user);
            this.w.data().user = user;
          })
        ).subscribe()
      }

    } else {
      LOG.debug.log({...CONTEXT, action: 'setUser', message: 'no user available'}, uuid);
    }
  }

  logout(): void {
    this.w.data().user = null;
    localStorage.clear();
    this.w.trigger(SystemActions.initRemote, {
      url: this.w.networkConfig.url,
      apikey: null,
    });
    UI.state.resetStore();
    const host = location.host;
    const protocol = host.includes('localhost') ? 'http://' : 'https://';
    LOG.debug.log({...CONTEXT, action: 'logout', message: 'returnTo :'}, protocol + host);
    this.auth.logout({
      logoutParams: {
        returnTo: (protocol + host)
      }
    });
  }
}
