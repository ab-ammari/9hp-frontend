import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AuthenticationButtonComponent} from "./authentication-button/authentication-button.component";
import {LoginButtonComponent} from "./login-button/login-button.component";
import {SignupButtonComponent} from "./signup-button/signup-button.component";
import {IonicModule} from "@ionic/angular";


@NgModule({
  declarations: [
    AuthenticationButtonComponent,
    LoginButtonComponent,
    SignupButtonComponent
  ],
  exports: [
    AuthenticationButtonComponent,
  ],
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class ComponentAuthModule {
}
