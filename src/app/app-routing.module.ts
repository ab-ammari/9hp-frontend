import {NgModule} from '@angular/core';
import {PreloadAllModules, RouterModule, Routes} from "@angular/router";
import {AuthGuard} from "@auth0/auth0-angular";
import {ProfileComponent} from "./pages/profile/profile.component";
import {PageNavigationWrapperComponent} from "./pages/page-navigation-wrapper/page-navigation-wrapper.component";

const routes: Routes = [
  {
    path: 'home',
    component: PageNavigationWrapperComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/home-page/home-page.module').then(m => m.HomePageModule),
      },
      {
        path: 'project-dashboard',
        loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule),
      },
      {
        path: 'projects',
        loadChildren: () => import('./pages/projet/projet.module').then(m => m.ProjetModule)
      },
      {path: 'profile', canActivate: [AuthGuard], component: ProfileComponent}
    ]
  },
  {path: '**', redirectTo: 'home'},
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {preloadingStrategy: PreloadAllModules, enableTracing: false})
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

