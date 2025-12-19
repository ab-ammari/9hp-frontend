import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FloatingActionButtonComponent } from './floating-action-button/floating-action-button.component';
import { FloatingPanelComponent } from './floating-panel/floating-panel.component';
import { FocusedDiagramViewerComponent } from './focused-diagram-viewer/focused-diagram-viewer.component';
import {FormsModule} from "@angular/forms";
import { ParadoxesPanelComponent } from './paradoxes-panel/paradoxes-panel.component';

@NgModule({
  declarations: [
    FloatingActionButtonComponent,
    FloatingPanelComponent,
    FocusedDiagramViewerComponent,
    ParadoxesPanelComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ],
  exports: [
    FloatingActionButtonComponent,
    FloatingPanelComponent,
    FocusedDiagramViewerComponent,
    ParadoxesPanelComponent 
  ]
})
export class FloatingComponentsModule { }
