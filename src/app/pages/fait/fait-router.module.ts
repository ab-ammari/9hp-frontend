import { NgModule } from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {FaitComponent} from "./fait.component";
import {NewFaitComponent} from "./new-fait/new-fait.component";
import {DetailsFaitComponent} from "./details-fait/details-fait.component";


const routes: Routes = [
  { path: '', component: FaitComponent },
  { path: 'new', component: NewFaitComponent},
  { path: 'details', component: DetailsFaitComponent}
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes),
  ]
})
export class FaitRouterModule { }
