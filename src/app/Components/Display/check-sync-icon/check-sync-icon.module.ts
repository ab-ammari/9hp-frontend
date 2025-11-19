import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckSyncIconComponent } from './check-sync-icon.component';
import {IonicModule} from "@ionic/angular";



@NgModule({
  declarations: [
    CheckSyncIconComponent
  ],
  exports: [
    CheckSyncIconComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class CheckSyncIconModule { }
