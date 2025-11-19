import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {SectionComponent} from "./section.component";
import {NewSondageComponent} from "./new-sondage/new-sondage.component";
import {DetailsSondageComponent} from "./details-sondage/details-sondage.component";


const routes: Routes = [
  { path: '', component: SectionComponent },
  { path: 'new', component: NewSondageComponent },
  { path: 'details', component: DetailsSondageComponent}
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class SondageRouterModule { }
