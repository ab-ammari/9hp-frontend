import { NgModule } from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {EnsemblesComponent} from "./ensembles.component";
import {NewEnsembleComponent} from "./new-ensemble/new-ensemble.component";
import {DetailsEnsembleComponent} from "./details-ensemble/details-ensemble.component";


const routes: Routes = [
  {path: '', component: EnsemblesComponent},
  {path: 'new', component: NewEnsembleComponent},
  {path: 'details', component: DetailsEnsembleComponent}
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class EnsemblesRouterModule { }
