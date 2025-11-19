import { NgModule } from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {ContenantsComponent} from "./contenants.component";
import {NewContenantComponent} from "./new-contenant/new-contenant.component";
import {DetailsContenantComponent} from "./details-contenant/details-contenant.component";


const routes: Routes = [
  { path: '', component: ContenantsComponent},
  { path: 'new', component: NewContenantComponent },
  { path: 'details', component: DetailsContenantComponent }
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class ContenantsRouterModule { }
