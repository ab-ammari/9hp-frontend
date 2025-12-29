import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { DataPanelComponent } from './data-panel.component';

// Imports nécessaires pour ce composant
import { DisplayModule } from '../../Display/display.module';
import { FloatingComponentsModule } from '../floating-components.module';

@NgModule({
  declarations: [
    DataPanelComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScrollingModule,
    DisplayModule,          
    FloatingComponentsModule
  ],
  exports: [
    DataPanelComponent
  ]
})
export class DataPanelModule { }