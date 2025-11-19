import { NgModule } from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {PrelevementComponent} from "./prelevement.component";
import {NewPrelevementComponent} from "./new-prelevement/new-prelevement.component";
import {DetailsPrelevementComponent} from "./details-prelevement/details-prelevement.component";


const routes: Routes = [
  { path: '', component: PrelevementComponent},
  { path: 'new', component: NewPrelevementComponent},
  { path: 'details', component: DetailsPrelevementComponent}
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class PrelevementRouterModule { }
