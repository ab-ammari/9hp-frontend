import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {PrelevementRouterModule} from "./prelevement-router.module";
import {PrelevementComponent} from "./prelevement.component";
import {IonicModule} from "@ionic/angular";
import {NewPrelevementComponent} from "./new-prelevement/new-prelevement.component";
import {InputsModule} from "../../Components/Inputs/inputs.module";
import {FormsModule} from "@angular/forms";
import {DetailsPrelevementComponent} from "./details-prelevement/details-prelevement.component";
import {FormModule} from "../../Components/Form/form.module";
import {DisplayModule} from "../../Components/Display/display.module";
import {CastorLinksModule} from "../../Components/widgets/castor-links/castor-links.module";
import {MatIconModule} from "@angular/material/icon";
import {
    CastorBtnCsvDownloaderModule
} from "../../Components/widgets/castor-btn-csv-downloader/castor-btn-csv-downloader.module";



@NgModule({
  declarations: [
    PrelevementComponent,
    NewPrelevementComponent,
    DetailsPrelevementComponent
  ],
    imports: [
        CommonModule,
        PrelevementRouterModule,
        IonicModule,
        InputsModule,
        FormsModule,
        FormModule,
        DisplayModule,
        CastorLinksModule,
        MatIconModule,
        CastorBtnCsvDownloaderModule
    ]
})
export class PrelevementModule { }
