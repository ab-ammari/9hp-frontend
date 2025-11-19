import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {EnsemblesRouterModule} from "./ensembles-router.module";
import {EnsemblesComponent} from "./ensembles.component";
import {IonicModule} from "@ionic/angular";
import {NewEnsembleComponent} from "./new-ensemble/new-ensemble.component";
import {InputsModule} from "../../Components/Inputs/inputs.module";
import {FormsModule} from "@angular/forms";
import {DetailsEnsembleComponent} from "./details-ensemble/details-ensemble.component";
import {DisplayModule} from "../../Components/Display/display.module";
import {FormModule} from "../../Components/Form/form.module";
import {CastorLinksModule} from "../../Components/widgets/castor-links/castor-links.module";
import {MatIconModule} from "@angular/material/icon";
import {
    CastorBtnCsvDownloaderModule
} from "../../Components/widgets/castor-btn-csv-downloader/castor-btn-csv-downloader.module";



@NgModule({
  declarations: [
    EnsemblesComponent,
    NewEnsembleComponent,
    DetailsEnsembleComponent
  ],
    imports: [
        CommonModule,
        EnsemblesRouterModule,
        IonicModule,
        InputsModule,
        FormsModule,
        DisplayModule,
        FormModule,
        CastorLinksModule,
        MatIconModule,
        CastorBtnCsvDownloaderModule
    ]
})
export class EnsemblesModule { }
