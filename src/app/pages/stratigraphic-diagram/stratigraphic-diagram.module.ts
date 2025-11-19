import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { StratigraphicDiagramComponent } from './stratigraphic-diagram.component';
import { StratigraphicDiagramRoutingModule } from './stratigraphic-diagram-routing.module';

@NgModule({
  declarations: [
    StratigraphicDiagramComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StratigraphicDiagramRoutingModule
  ]
})
export class StratigraphicDiagramModule { }
