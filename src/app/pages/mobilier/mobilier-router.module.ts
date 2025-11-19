import { NgModule } from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {MobilierComponent} from "./mobilier.component";
import {NewMobilierComponent} from "./new-mobilier/new-mobilier.component";
import {DetailsMobilierComponent} from "./details-mobilier/details-mobilier.component";


const routes: Routes = [
  { path: '', component: MobilierComponent},
  { path: 'new', component: NewMobilierComponent},
  { path: 'details', component: DetailsMobilierComponent}
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class MobilierRouterModule { }
