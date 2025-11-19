import { NgModule } from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {EditProjetComponent} from "./edit-projet/edit-projet.component";
import {ProjetComponent} from "./projet.component";
import {NewProjectComponent} from "./new-project/new-project.component";
import {ProjectConfigurationComponent} from "./project-configuration/project-configuration.component";

const routes: Routes = [
  { path: '', component: ProjetComponent },
  { path: 'new', component: NewProjectComponent },
  { path: 'edit', component: EditProjetComponent },
  { path: 'configuration', component: ProjectConfigurationComponent },
];

@NgModule({

  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule]
})
export class ProjetRoutingModule { }
