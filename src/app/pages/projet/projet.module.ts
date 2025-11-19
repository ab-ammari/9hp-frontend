import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProjetComponent} from "./projet.component";
import {EditProjetComponent} from "./edit-projet/edit-projet.component";
import {ProjetRoutingModule} from "./projet-routing.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {PipesModule} from "../../pipe/pipes.module";
import {IonicModule} from "@ionic/angular";
import {NewProjectComponent} from "./new-project/new-project.component";
import {FormModule} from "../../Components/Form/form.module";
import {DisplayModule} from "../../Components/Display/display.module";
import {MatIconModule} from "@angular/material/icon";
import { ProjectConfigurationComponent } from './project-configuration/project-configuration.component';
import { ProjectTagConfigurationComponent } from './project-configuration/project-tag-configuration/project-tag-configuration.component';
import {MatLegacyTooltipModule as MatTooltipModule} from "@angular/material/legacy-tooltip";
import {InputsModule} from "../../Components/Inputs/inputs.module";
import {AccessGuardModule} from "../../Components/widgets/access-guard/access-guard.module";
import { ProjectTypeConfigurationComponent } from './project-configuration/project-type-configuration/project-type-configuration.component';



@NgModule({
  declarations: [
    ProjetComponent,
    EditProjetComponent,
    NewProjectComponent,
    ProjectConfigurationComponent,
    ProjectTagConfigurationComponent,
    ProjectTypeConfigurationComponent,
  ],
    imports: [
        CommonModule,
        ProjetRoutingModule,
        ReactiveFormsModule,
        PipesModule,
        IonicModule,
        FormModule,
        DisplayModule,
        MatIconModule,
        FormsModule,
        MatTooltipModule,
        InputsModule,
        AccessGuardModule,
    ]
})
export class ProjetModule { }
