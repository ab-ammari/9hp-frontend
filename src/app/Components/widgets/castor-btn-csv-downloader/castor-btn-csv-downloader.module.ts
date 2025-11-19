import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {CastorBtnCsvDownloaderComponent} from "./castor-btn-csv-downloader.component";
import {IonicModule} from "@ionic/angular";
import {MatIconModule} from "@angular/material/icon";
import {FormsModule} from "@angular/forms";



@NgModule({
  declarations: [
    CastorBtnCsvDownloaderComponent
  ],
  exports: [
    CastorBtnCsvDownloaderComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    MatIconModule,
    FormsModule
  ]
})
export class CastorBtnCsvDownloaderModule { }
