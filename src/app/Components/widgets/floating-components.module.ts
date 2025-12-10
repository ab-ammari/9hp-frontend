import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FloatingActionButtonComponent } from './floating-action-button/floating-action-button.component';
import { FloatingPanelComponent } from './floating-panel/floating-panel.component';
import { FocusedDiagramViewerComponent } from './focused-diagram-viewer/focused-diagram-viewer.component';
import {FormsModule} from "@angular/forms";
import { DeleteConfirmationDialogComponent } from './delete-confirmation-dialog/delete-confirmation-dialog.component';

@NgModule({
  declarations: [
    FloatingActionButtonComponent,
    FloatingPanelComponent,
    FocusedDiagramViewerComponent,
    DeleteConfirmationDialogComponent
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
    DeleteConfirmationDialogComponent
  ]
})
export class FloatingComponentsModule { }
