import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {StatisticsRouterModule} from "./statistics-router.module";
import {StatisticsComponent} from "./statistics.component";
import {IonicModule} from "@ionic/angular";
import {DisplayModule} from "../../Components/Display/display.module";
import {NgxChartsModule} from "@swimlane/ngx-charts";
import {MatLegacyProgressBarModule as MatProgressBarModule} from "@angular/material/legacy-progress-bar";
import {FormsModule} from "@angular/forms";
import {MatIconModule} from "@angular/material/icon";
import {MatLegacyMenuModule as MatMenuModule} from "@angular/material/legacy-menu";



@NgModule({
  declarations: [
    StatisticsComponent
  ],
  imports: [
    CommonModule,
    StatisticsRouterModule,
    IonicModule,
    DisplayModule,
    NgxChartsModule,
    MatProgressBarModule,
    FormsModule,
    MatIconModule,
    MatMenuModule
  ]
})
export class StatisticsModule { }
