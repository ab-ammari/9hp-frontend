import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StratigraphicTestComponent } from './stratigraphic-test.component';
import { StratigraphicTestRouterModule } from './stratigraphic-test-router.module';
import { IonicModule } from "@ionic/angular";
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DisplayModule } from "../../Components/Display/display.module";
import { FloatingComponentsModule } from "../../Components/widgets/floating-components.module";

@NgModule({
  declarations: [
    StratigraphicTestComponent
  ],
  imports: [
    CommonModule,
    StratigraphicTestRouterModule,
    IonicModule,
    FormsModule,
    MatIconModule,
    DisplayModule,
    FloatingComponentsModule
  ]
})
export class StratigraphicTestModule { }