import { Injectable } from '@angular/core';
import {AlertController} from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {

  constructor(private alertController: AlertController) { }

  async showConfirmDialog(
    headerMessage: string,
    message: string,
    confirmHandler: (value: any) => boolean | void | { [key: string]: any },
    cancelHandler: (value: any) => boolean | void | { [key: string]: any },
    confirmLabel: string = 'Ok',
    cancelLabel: string = 'Annuler'
  ) {
    const alert = await this.alertController.create({
      header: headerMessage,
      message,
      buttons: [
        {
          text: cancelLabel,
          cssClass: 'alert-ionic-cancel-button',
          role: 'cancel',
          id: 'cancel-button',
          handler: cancelHandler
        },
        {
          text: confirmLabel,
          cssClass: 'alert-ionic-confirm-button',
          id: 'confirm-button',
          handler: confirmHandler
        }
      ]
    });
    console.log("Present confirm dialog", alert);
    await alert.present();
  }

  async showInfoDialog(
    headerMessage: string,
    message: string,
    buttonLabel: string = 'OK'
  ) {
    const alert = await this.alertController.create({
      header: headerMessage,
      message,
      buttons: [
        {
          text: buttonLabel,
          role: 'confirm',
          id: 'confirm-button'
        }
      ]
    });
    await alert.present();
  }
}
