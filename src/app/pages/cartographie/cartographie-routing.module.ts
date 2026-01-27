import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CartographieComponent } from './cartographie.component';

const routes: Routes = [
  {
    path: '',
    component: CartographieComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CartographieRoutingModule { }
