import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SplitPaneMenuComponent} from "./split-pane-menu/split-pane-menu.component";
import {IonicModule} from "@ionic/angular";
import {ComponentAuthModule} from "../components-auth0/component-auth.module";
import {RouterModule} from "@angular/router";
import {DrawerRailModule} from "angular-material-rail-drawer";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatLegacyButtonModule as MatButtonModule} from "@angular/material/legacy-button";
import {MatIconModule} from "@angular/material/icon";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatLegacyListModule as MatListModule} from "@angular/material/legacy-list";
import {DisplayModule} from "../Components/Display/display.module";
import {TechnicalSettingsComponent} from "../Components/widgets/technical-settings/technical-settings.component";
import {FormsModule} from "@angular/forms";



@NgModule({
  declarations: [
    SplitPaneMenuComponent,
    TechnicalSettingsComponent,
  ],
  exports: [
    SplitPaneMenuComponent,
  ],
    imports: [
        CommonModule,
        IonicModule,
        ComponentAuthModule,
        RouterModule,
        DrawerRailModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatSidenavModule,
        MatListModule,
        DisplayModule,
        FormsModule
    ]
})
export class ComponentsNavModule { }
