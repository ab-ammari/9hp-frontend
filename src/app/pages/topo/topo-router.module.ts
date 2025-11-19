import { NgModule } from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {TopoComponent} from "./topo.component";
import {NewTopoComponent} from "./new-topo/new-topo.component";
import {DetailsTopoComponent} from "./details-topo/details-topo.component";


const routes: Routes = [
  {path: '', component: TopoComponent},
  {path: 'new', component: NewTopoComponent},
  {path: 'details', component: DetailsTopoComponent}
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class TopoRouterModule { }
