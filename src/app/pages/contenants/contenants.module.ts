import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ContenantsComponent} from "./contenants.component";
import {ContenantsRouterModule} from "./contenants-router.module";
import {IonicModule} from "@ionic/angular";
import {NewContenantComponent} from "./new-contenant/new-contenant.component";
import {InputsModule} from "../../Components/Inputs/inputs.module";
import {DetailsContenantComponent} from "./details-contenant/details-contenant.component";
import {FormModule} from "../../Components/Form/form.module";
import {DisplayModule} from "../../Components/Display/display.module";
import {CastorLinksModule} from "../../Components/widgets/castor-links/castor-links.module";
import {MatIconModule} from "@angular/material/icon";
import {FormsModule} from "@angular/forms";
import {
    CastorBtnCsvDownloaderModule
} from "../../Components/widgets/castor-btn-csv-downloader/castor-btn-csv-downloader.module";



@NgModule({
  declarations: [
    ContenantsComponent,
    NewContenantComponent,
    DetailsContenantComponent,
  ],
    imports: [
        CommonModule,
        ContenantsRouterModule,
        IonicModule,
        InputsModule,
        FormModule,
        DisplayModule,
        CastorLinksModule,
        MatIconModule,
        FormsModule,
        CastorBtnCsvDownloaderModule
    ]
})
export class ContenantsModule { }
