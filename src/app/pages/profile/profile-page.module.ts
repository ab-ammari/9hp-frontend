import {NgModule} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {ProfileComponent} from "./profile.component";
import {IonicModule} from "@ionic/angular";
import {FormsModule} from "@angular/forms";
import {CheckSyncIconModule} from "../../Components/Display/check-sync-icon/check-sync-icon.module";


@NgModule({
  declarations: [ProfileComponent],
    imports: [
        CommonModule,
        IonicModule,
        FormsModule,
        CheckSyncIconModule,
        NgOptimizedImage
    ], exports: [ProfileComponent]
})
export class ProfilePageModule {
}
