import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {UsComponent} from "./us.component";
import {UsRouterModule} from "./us-router.module";
import {IonicModule} from "@ionic/angular";
import {NewUsComponent} from "./new-us/new-us.component";
import {InputsModule} from "../../Components/Inputs/inputs.module";
import {DetailsUsComponent} from "./details-us/details-us.component";
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
    UsComponent,
    NewUsComponent,
    DetailsUsComponent,
  ],
    imports: [
        CommonModule,
        UsRouterModule,
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
export class UsModule { }
