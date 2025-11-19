import {LOCALE_ID, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HttpClientModule} from "@angular/common/http";
import {ServiceWorkerModule} from '@angular/service-worker';
import {BrowserAnimationsModule, NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatLegacyProgressSpinnerModule as MatProgressSpinnerModule} from '@angular/material/legacy-progress-spinner';
import {MatLegacyTabsModule as MatTabsModule} from '@angular/material/legacy-tabs';
import {MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';


import {AuthModule} from '@auth0/auth0-angular';

import { environment} from '../environments/environment';

import {AppComponent} from './app.component';
import {UserService} from "./services/user.service";

import {IonicModule} from "@ionic/angular";
import {CoreModule} from "ngx-wcore";
import {PipesModule} from "./pipe/pipes.module";
import {AppRoutingModule} from "./app-routing.module";
import {DirectiveModule} from "./directive/directive.module";
import {ProfilePageModule} from "./pages/profile/profile-page.module";
import {registerLocaleData} from "@angular/common";
import localeFr from '@angular/common/locales/fr';
import {CastorSynchroniserComponent} from './Components/widgets/castor-synchroniser/castor-synchroniser.component';
import {PageNavigationWrapperComponent} from './pages/page-navigation-wrapper/page-navigation-wrapper.component';
import {ComponentAuthModule} from "./components-auth0/component-auth.module";
import {DevToolsInterfaceComponent} from './Components/widgets/dev-tools-interface/dev-tools-interface.component';
import {auth0Config} from "./util/dev";
import {
  LinkObjectCreatedModalModule
} from "./Components/widgets/link-object-created-modal/link-object-created-modal.module";
import { LinkEditingModalComponent } from './Components/widgets/link-editing-modal/link-editing-modal.component';
import {DisplayModule} from "./Components/Display/display.module";
import {FormModule} from "./Components/Form/form.module";
import {InputsModule} from "./Components/Inputs/inputs.module";

registerLocaleData(localeFr);




@NgModule({
  declarations: [
    AppComponent,
    CastorSynchroniserComponent,
    PageNavigationWrapperComponent,
    DevToolsInterfaceComponent,
    LinkEditingModalComponent,
  ],
  imports: [
    CoreModule,
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    ProfilePageModule,
    ReactiveFormsModule,
    HttpClientModule,
    AuthModule.forRoot(auth0Config()),
    IonicModule.forRoot({
      animated: true,
      scrollPadding: false,
      scrollAssist: false
    }),
    ServiceWorkerModule.register('service-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:8000'
    }),
    NoopAnimationsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    BrowserAnimationsModule,
    MatDialogModule,
    PipesModule,
    DirectiveModule,
    ComponentAuthModule,
    LinkObjectCreatedModalModule,
    DisplayModule,
    FormModule,
    InputsModule
  ],
  providers: [
    UserService,
    {provide: LOCALE_ID, useValue: 'fr-FR'},
  ],
  exports: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
