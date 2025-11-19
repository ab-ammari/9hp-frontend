import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TopoRouterModule} from "./topo-router.module";
import {TopoComponent} from "./topo.component";
import {IonicModule} from "@ionic/angular";
import {NewTopoComponent} from "./new-topo/new-topo.component";
import {DetailsTopoComponent} from "./details-topo/details-topo.component";
import {InputsModule} from "../../Components/Inputs/inputs.module";
import {DisplayModule} from "../../Components/Display/display.module";
import {FormModule} from "../../Components/Form/form.module";
import {CastorLinksModule} from "../../Components/widgets/castor-links/castor-links.module";
import {MatIconModule} from "@angular/material/icon";
import {
    CastorBtnCsvDownloaderModule
} from "../../Components/widgets/castor-btn-csv-downloader/castor-btn-csv-downloader.module";



@NgModule({
  declarations: [
    TopoComponent,
    NewTopoComponent,
    DetailsTopoComponent
  ],
    imports: [
        CommonModule,
        TopoRouterModule,
        IonicModule,
        InputsModule,
        DisplayModule,
        FormModule,
        CastorLinksModule,
        MatIconModule,
        CastorBtnCsvDownloaderModule
    ]
})
export class TopoModule { }
