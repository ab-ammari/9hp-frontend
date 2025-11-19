import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AccessGuardComponent} from "./access-guard.component";
import {MatLegacyTooltipModule as MatTooltipModule} from "@angular/material/legacy-tooltip";


@NgModule({
  declarations: [
    AccessGuardComponent
  ],
  exports: [
    AccessGuardComponent
  ],
  imports: [
    CommonModule,
    MatTooltipModule
  ]
})
export class AccessGuardModule {
}
