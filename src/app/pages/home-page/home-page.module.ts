import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomePageComponent } from './home-page.component';
import {HomePageRouterModule} from "./home-page-router.module";
import {IonicModule} from "@ionic/angular";
import {ComponentAuthModule} from "../../components-auth0/component-auth.module";



@NgModule({
  declarations: [
    HomePageComponent
  ],
  imports: [
    CommonModule,
    HomePageRouterModule,
    IonicModule,
    ComponentAuthModule
  ]
})
export class HomePageModule { }
