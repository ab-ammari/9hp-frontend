import {NgModule} from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {DashboardComponent} from "./dashboard.component";
import {ApiDbTable} from "../../../../shared";

const routes: Routes = [
  { path: '', component: DashboardComponent,
    children: [
      {
        path: '',
        redirectTo: ApiDbTable.secteur,
        pathMatch: 'full'
      },
      {
        path: ApiDbTable.secteur,
        loadChildren: () => import('../secteur/secteur.module').then(m => m.SecteurModule)
      },
      {
        path: ApiDbTable.fait,
        loadChildren: () => import('../fait/fait.module').then(m => m.FaitModule)
      },
      {
        path: ApiDbTable.us,
        loadChildren: () => import('../us/us.module').then(m => m.UsModule)
      },
      {
        path: ApiDbTable.contenant,
        loadChildren: () => import('../contenants/contenants.module').then(m => m.ContenantsModule)
      },
      {
        path: ApiDbTable.echantillon_mobilier,
        loadChildren: () => import('../mobilier/mobilier.module').then(m => m.MobilierModule)
      },
      {
        path: ApiDbTable.echantillon_prelevement,
        loadChildren: () => import('../prelevement/prelevement.module').then(m => m.PrelevementModule)
      },
      {
        path: ApiDbTable.ensemble,
        loadChildren: () => import('../ensembles/ensembles.module').then(m => m.EnsemblesModule)
      },
      {
        path: ApiDbTable.section_sondage,
        loadChildren: () => import('../sondage/sondage.module').then(m => m.SondageModule)
      },
      {
        path: ApiDbTable.document_minute,
        loadChildren: () => import('../minutes/minutes.module').then(m => m.MinutesModule)
      },
      {
        path: ApiDbTable.document_photo,
        loadChildren: () => import('../photos/photos.module').then(m => m.PhotosModule)
      },
      {
        path: ApiDbTable.topo,
        loadChildren: () => import('../topo/topo.module').then(m => m.TopoModule)
      },
      {
        path: 'statistics',
        loadChildren: () => import('../statistics/statistics.module').then(m => m.StatisticsModule)
      },
      {
        path: 'stratigraphic-test',
        loadChildren: () => import('../stratigraphic-test/stratigraphic-test.module').then(m => m.StratigraphicTestModule),
        data: { section: 'dashboard' }
      },
      {
        path: 'stratigraphic-diagram',
        loadChildren: () => import('../stratigraphic-diagram/stratigraphic-diagram.module')
          .then(m => m.StratigraphicDiagramModule)
      },
      {
        path: 'stratigraphic-diagram',
        loadChildren: () => import('../stratigraphic-diagram/stratigraphic-diagram.module').then(m => m.StratigraphicDiagramModule),
        data: { section: 'dashboard' }
      }
    ]},
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes),
  ]
})
export class DashboardRouterModule {
}
