import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaitComponent } from './fait.component';
import {FaitRouterModule} from "./fait-router.module";
import {IonicModule} from "@ionic/angular";
import {NewFaitComponent} from "./new-fait/new-fait.component";
import {FormsModule} from "@angular/forms";
import {MatLegacyFormFieldModule as MatFormFieldModule} from "@angular/material/legacy-form-field";
import {MatLegacySelectModule as MatSelectModule} from "@angular/material/legacy-select";
import {MatLegacyOptionModule as MatOptionModule} from "@angular/material/legacy-core";
import {DetailsFaitComponent} from "./details-fait/details-fait.component";
import {FormModule} from "../../Components/Form/form.module";
import {InputsModule} from "../../Components/Inputs/inputs.module";
import {DisplayModule} from "../../Components/Display/display.module";
import {CastorLinksModule} from "../../Components/widgets/castor-links/castor-links.module";
import {MatIconModule} from "@angular/material/icon";
import {
    CastorBtnCsvDownloaderModule
} from "../../Components/widgets/castor-btn-csv-downloader/castor-btn-csv-downloader.module";


@NgModule({
    declarations: [
        FaitComponent,
        NewFaitComponent,
        DetailsFaitComponent
    ],
    exports: [
        FaitComponent
    ],
    imports: [
        CommonModule,
        FaitRouterModule,
        IonicModule,
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
        FormModule,
        InputsModule,
        DisplayModule,
        CastorLinksModule,
        MatIconModule,
        CastorBtnCsvDownloaderModule,
    ]
})
export class FaitModule { }
