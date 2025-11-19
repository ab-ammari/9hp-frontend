import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HeadbandTabsNavComponent } from './headband-tabs-nav.component';

@NgModule({
  declarations: [HeadbandTabsNavComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [HeadbandTabsNavComponent]
})
export class HeadbandTabsNavModule { }
