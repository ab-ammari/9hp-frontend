import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecteurComponent } from './secteur.component';
import { DetailsSecteurComponent } from './details-secteur/details-secteur.component';
import {SecteurRoutingModule} from "./secteur-routing.module";
import {PipesModule} from "../../pipe/pipes.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NewSecteurComponent} from "./new-secteur/new-secteur.component";
import {FormModule} from "../../Components/Form/form.module";
import {IonicModule} from "@ionic/angular";
import {CastorLinksModule} from "../../Components/widgets/castor-links/castor-links.module";
import {DisplayModule} from "../../Components/Display/display.module";
import {MatIconModule} from "@angular/material/icon";
import {InputsModule} from "../../Components/Inputs/inputs.module";
import {
    CastorBtnCsvDownloaderModule
} from "../../Components/widgets/castor-btn-csv-downloader/castor-btn-csv-downloader.module";



@NgModule({
  declarations: [
    SecteurComponent,
    DetailsSecteurComponent,
    NewSecteurComponent,
  ],
    imports: [
        CommonModule,
        SecteurRoutingModule,
        PipesModule,
        ReactiveFormsModule,
        FormModule,
        IonicModule,
        DisplayModule,
        CastorLinksModule,
        MatIconModule,
        InputsModule,
        CastorBtnCsvDownloaderModule,
        FormsModule,
    ]
})
export class SecteurModule { }
