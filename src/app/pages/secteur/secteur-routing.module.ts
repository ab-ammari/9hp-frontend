import { NgModule } from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {SecteurComponent} from "./secteur.component";
import {DetailsSecteurComponent} from "./details-secteur/details-secteur.component";
import {NewSecteurComponent} from "./new-secteur/new-secteur.component";


const routes: Routes = [
  { path: '', component: SecteurComponent },
  { path: 'new', component: NewSecteurComponent },
  { path: 'details', component: DetailsSecteurComponent },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class SecteurRoutingModule { }
