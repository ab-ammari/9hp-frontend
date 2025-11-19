import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {PhotosRouterModule} from "./photos-router.module";
import {PhotosComponent} from "./photos.component";
import {IonicModule} from "@ionic/angular";
import {NewPhotoComponent} from "./new-photo/new-photo.component";
import {InputsModule} from "../../Components/Inputs/inputs.module";
import {DetailsPhotoComponent} from "./details-photo/details-photo.component";
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
    PhotosComponent,
    NewPhotoComponent,
    DetailsPhotoComponent
  ],
    imports: [
        CommonModule,
        PhotosRouterModule,
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
export class PhotosModule { }
