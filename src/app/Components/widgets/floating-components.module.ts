import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FloatingActionButtonComponent } from './floating-action-button/floating-action-button.component';
import { FloatingPanelComponent } from './floating-panel/floating-panel.component';
import { FocusedDiagramViewerComponent } from './focused-diagram-viewer/focused-diagram-viewer.component';
import {FormsModule} from "@angular/forms";
import { CyclesPanelComponent } from './cycles-panel/cycles-panel.component';

@NgModule({
  declarations: [
    FloatingActionButtonComponent,
    FloatingPanelComponent,
    FocusedDiagramViewerComponent,
    CyclesPanelComponent
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
    CyclesPanelComponent
  ]
})
export class FloatingComponentsModule { }
