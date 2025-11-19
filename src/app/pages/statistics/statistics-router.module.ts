import { NgModule } from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {StatisticsComponent} from "./statistics.component";

const routes: Routes = [
  {path: '', component: StatisticsComponent}
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class StatisticsRouterModule { }
