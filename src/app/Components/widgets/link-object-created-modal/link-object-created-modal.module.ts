import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {LinkObjectCreatedModalComponent} from "./link-object-created-modal.component";
import {MatLegacyFormFieldModule as MatFormFieldModule} from "@angular/material/legacy-form-field";
import {MatLegacySelectModule as MatSelectModule} from "@angular/material/legacy-select";
import {FormModule} from "../../Form/form.module";



@NgModule({
  declarations: [LinkObjectCreatedModalComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    FormModule,
  ]
})
export class LinkObjectCreatedModalModule { }
