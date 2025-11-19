import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SondageRouterModule} from "./sondage-router.module";
import {SectionComponent} from "./section.component";
import {IonicModule} from "@ionic/angular";
import {NewSondageComponent} from "./new-sondage/new-sondage.component";
import {InputsModule} from "../../Components/Inputs/inputs.module";
import {FormsModule} from "@angular/forms";
import {DetailsSondageComponent} from "./details-sondage/details-sondage.component";
import {DisplayModule} from "../../Components/Display/display.module";
import {FormModule} from "../../Components/Form/form.module";
import {CastorLinksModule} from "../../Components/widgets/castor-links/castor-links.module";
import {MatIconModule} from "@angular/material/icon";
import {
    CastorBtnCsvDownloaderModule
} from "../../Components/widgets/castor-btn-csv-downloader/castor-btn-csv-downloader.module";



@NgModule({
  declarations: [
    SectionComponent,
    NewSondageComponent,
    DetailsSondageComponent
  ],
    imports: [
        CommonModule,
        SondageRouterModule,
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
export class SondageModule { }
