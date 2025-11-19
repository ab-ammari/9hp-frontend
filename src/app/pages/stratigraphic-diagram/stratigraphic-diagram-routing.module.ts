import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StratigraphicDiagramComponent } from './stratigraphic-diagram.component';

const routes: Routes = [
  {
    path: '',
    component: StratigraphicDiagramComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StratigraphicDiagramRoutingModule { }
