import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FloatingActionButtonComponent } from './floating-action-button/floating-action-button.component';
import { FloatingPanelComponent } from './floating-panel/floating-panel.component';

@NgModule({
  declarations: [
    FloatingActionButtonComponent,
    FloatingPanelComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    FloatingActionButtonComponent,
    FloatingPanelComponent
  ]
})
export class FloatingComponentsModule { }
