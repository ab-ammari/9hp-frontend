import { NgModule } from '@angular/core';
import { RouterModule, Routes } from "@angular/router";
import { StratigraphicTestComponent } from "./stratigraphic-test.component";
import {DashboardComponent} from "../dashboard/dashboard.component";
import {ApiDbTable} from "../../../../shared";

const routes: Routes = [
  {path: '', component: StratigraphicTestComponent,
    children: [
      {
        path: 'stratigraphic-diagram',
        loadChildren: () => import('../stratigraphic-diagram/stratigraphic-diagram.module')
          .then(m => m.StratigraphicDiagramModule)
      }
    ]}
];


@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class StratigraphicTestRouterModule { }
