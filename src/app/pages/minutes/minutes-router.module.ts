import { NgModule } from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {MinutesComponent} from "./minutes.component";
import {NewMinuteComponent} from "./new-minute/new-minute.component";
import {DetailsMinuteComponent} from "./details-minute/details-minute.component";


const routes: Routes = [
  { path: '', component: MinutesComponent},
  { path: 'new', component: NewMinuteComponent},
  { path: 'details', component: DetailsMinuteComponent}
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class MinutesRouterModule { }
