import {Injectable} from '@angular/core';
import {ToastController} from '@ionic/angular';
import {Manager} from "../util/utilitysingletons/activity-manager";
import {tap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastController: ToastController) {
    Manager.onNewMessage.pipe(
      tap((message) =>  {
        switch (message.type) {
          case "error":
            this.error('Error', message.text);
            break;
          case "success":
            this.success('Error', message.text);
            break;
          case "info":
            this.info('Error', message.text);
            break;
          default:
            this.notif('Error', message.text);
            break;

        }
      })
    ).subscribe();
  }

  async notif(title: string, content: string, cancelLabel: string = 'Ok') {
    const toast = await this.toastController.create({
      header: title,
      message: content,
      color: 'tertiary',
      icon: 'information-circle',
      position: 'top',
      duration: 15000,
      cssClass: '',
      buttons: [
        {
          text: cancelLabel,
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ],
      layout: 'stacked'
    });
    await toast.present();
  }

  async warn(title: string, content: string, cancelLabel: string = 'Ok') {
    const toast = await this.toastController.create({
      header: title,
      message: content,
      color: 'warning',
      icon: 'warning-outline',
      position: 'bottom',
      duration: 5000,
      cssClass: 'tabs-bottom',
      buttons: [
        {
          text: cancelLabel,
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ],
      layout: 'stacked'
    });
    await toast.present();
  }

  async success(title: string, content: string, cancelLabel: string = 'Ok') {
    const toast = await this.toastController.create({
      header: title,
      message: content,
      color: 'success',
      icon: 'checkmark-done-outline',
      position: 'bottom',
      duration: 2000,
      cssClass: 'tabs-bottom',
      buttons: [
        {
          text: cancelLabel,
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ],
      layout: 'stacked'
    });
    await toast.present();
  }

  async info(title: string, content: string, cancelLabel: string = 'Ok', duration: number = 2000) {
    const toast = await this.toastController.create({
      header: title,
      message: content,
      color: 'tertiary',
      icon: 'information-circle',
      position: 'bottom',
      duration,
      cssClass: 'tabs-bottom',
      buttons: [
        {
          text: cancelLabel,
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ],
      layout: 'stacked'
    });
    await toast.present();
  }

  async error(title: string, content: string, cancelLabel: string = 'Ok') {
    const toast = await this.toastController.create({
      header: title,
      message: content,
      color: 'danger',
      icon: 'bug-outline',
      position: 'middle',
      duration: 20000,
      cssClass: 'tabs-bottom',
      buttons: [
        {
          text: cancelLabel,
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ],
      layout: 'stacked'
    });
    await toast.present();
  }
}
