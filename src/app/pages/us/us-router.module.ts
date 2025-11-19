import { NgModule } from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {UsComponent} from "./us.component";
import {NewUsComponent} from "./new-us/new-us.component";
import {DetailsUsComponent} from "./details-us/details-us.component";

const routes: Routes = [
  { path: '', component: UsComponent },
  { path: 'new', component: NewUsComponent },
  { path: 'details', component: DetailsUsComponent}
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes),
  ]
})
export class UsRouterModule { }

