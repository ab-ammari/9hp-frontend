import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MinutesRouterModule} from "./minutes-router.module";
import {MinutesComponent} from "./minutes.component";
import {IonicModule} from "@ionic/angular";
import {NewMinuteComponent} from "./new-minute/new-minute.component";
import {InputsModule} from "../../Components/Inputs/inputs.module";
import {DetailsMinuteComponent} from "./details-minute/details-minute.component";
import {DisplayModule} from "../../Components/Display/display.module";
import {FormModule} from "../../Components/Form/form.module";
import {FormsModule} from "@angular/forms";
import {CastorLinksModule} from "../../Components/widgets/castor-links/castor-links.module";
import {MatIconModule} from "@angular/material/icon";
import {
  CastorBtnCsvDownloaderModule
} from "../../Components/widgets/castor-btn-csv-downloader/castor-btn-csv-downloader.module";



@NgModule({
  declarations: [
    MinutesComponent,
    NewMinuteComponent,
    DetailsMinuteComponent
  ],
  imports: [
    CommonModule,
    MinutesRouterModule,
    IonicModule,
    InputsModule,
    DisplayModule,
    FormModule,
    FormsModule,
    CastorLinksModule,
    MatIconModule,
    CastorBtnCsvDownloaderModule
  ]
})
export class MinutesModule { }
