import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MobilierRouterModule} from "./mobilier-router.module";
import {MobilierComponent} from "./mobilier.component";
import {IonicModule} from "@ionic/angular";
import {NewMobilierComponent} from "./new-mobilier/new-mobilier.component";
import {InputsModule} from "../../Components/Inputs/inputs.module";
import {FormsModule} from "@angular/forms";
import {DetailsMobilierComponent} from "./details-mobilier/details-mobilier.component";
import {FormModule} from "../../Components/Form/form.module";
import {DisplayModule} from "../../Components/Display/display.module";
import {CastorLinksModule} from "../../Components/widgets/castor-links/castor-links.module";
import {MatIconModule} from "@angular/material/icon";
import {
    CastorBtnCsvDownloaderModule
} from "../../Components/widgets/castor-btn-csv-downloader/castor-btn-csv-downloader.module";



@NgModule({
  declarations: [
    MobilierComponent,
    NewMobilierComponent,
    DetailsMobilierComponent,
  ],
    imports: [
        CommonModule,
        MobilierRouterModule,
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
export class MobilierModule { }
