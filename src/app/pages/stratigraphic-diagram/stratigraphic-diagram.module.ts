import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { StratigraphicDiagramComponent } from './stratigraphic-diagram.component';
import { StratigraphicDiagramRoutingModule } from './stratigraphic-diagram-routing.module';
import {FloatingComponentsModule} from "../../Components/widgets/floating-components.module";
import {DisplayModule} from "../../Components/Display/display.module";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { DataPanelModule } from "src/app/Components/widgets/data-panel/data-panel.module";
import { DiagramNodePopoverModule } from "../../Components/Display/diagram-node-popover/diagram-node-popover.module";

@NgModule({
  declarations: [
    StratigraphicDiagramComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StratigraphicDiagramRoutingModule,
    FloatingComponentsModule,
    DisplayModule,
    ScrollingModule,
    DataPanelModule,
    DiagramNodePopoverModule
]
})
export class StratigraphicDiagramModule { }
