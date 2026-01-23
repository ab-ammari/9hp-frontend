import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DashboardComponent} from './dashboard.component';
import {IonicModule} from "@ionic/angular";
import {DashboardRouterModule} from "./dashboard.router.module";
import {RouterModule} from "@angular/router";
import {ComponentsNavModule} from "../../components-nav/components-nav.module";
import {DisplayModule} from "../../Components/Display/display.module";
import {HeadbandTabsNavModule} from "../../Components/Display/headband-tabs-nav/headband-tabs-nav.module";


@NgModule({
  declarations: [
    DashboardComponent
  ],
    imports: [
        DashboardRouterModule,
        CommonModule,
        IonicModule,
        RouterModule,
        ComponentsNavModule,
        DisplayModule,
      HeadbandTabsNavModule,
    ]
})
export class DashboardModule {
}
