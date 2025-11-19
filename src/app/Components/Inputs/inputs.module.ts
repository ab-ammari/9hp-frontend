import { NgModule } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {IonicDateTimePickerComponent} from "./ionic-date-time-picker/ionic-date-time-picker.component";
import {IonicModule} from "@ionic/angular";
import {FormsModule} from "@angular/forms";
import {UsTypeSelectorComponent} from "./us-type-selector/us-type-selector.component";
import {FormPlanSelectorComponent} from "./form-plan-selector/form-plan-selector.component";
import {FormProfileSelectorComponent} from "./form-profile-selector/form-profile-selector.component";
import {UsSelectorComponent} from "./us-selector/us-selector.component";
import {FaitSelectorComponent} from "./fait-selector/fait-selector.component";
import {DimensionInputComponent} from "./dimension-input/dimension-input.component";
import {SondageSelectorComponent} from "./sondage-selector/sondage-selector.component";
import {ValidCancelGroupedBtnComponent} from "./valid-cancel-grouped-btn/valid-cancel-grouped-btn.component";
import {MatIconModule} from "@angular/material/icon";
import { CastorTypeSelectorComponent } from './castor-type-selector/castor-type-selector.component';
import { CastorTagInputComponent } from './castor-tag-input/castor-tag-input.component';
import { CastorProjectUserSelectionComponent } from './castor-project-user-selection/castor-project-user-selection.component';
import {PipesModule} from "../../pipe/pipes.module";
import { CastorFileInputComponent } from './castor-file-input/castor-file-input.component';
import {DirectiveModule} from "../../directive/directive.module";
import { CastorObjectSelectorComponent } from './castor-object-selector/castor-object-selector.component';
import {DisplayModule} from "../Display/display.module";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {MatListModule} from "@angular/material/list";
import {MatButtonModule} from "@angular/material/button";
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, ScrollingModule} from "@angular/cdk/scrolling";


@NgModule({
  declarations: [
    IonicDateTimePickerComponent,
    UsTypeSelectorComponent,
    FormPlanSelectorComponent,
    FormProfileSelectorComponent,
    UsSelectorComponent,
    FaitSelectorComponent,
    DimensionInputComponent,
    SondageSelectorComponent,
    ValidCancelGroupedBtnComponent,
    CastorTypeSelectorComponent,
    CastorTagInputComponent,
    CastorProjectUserSelectionComponent,
    CastorFileInputComponent,
    CastorObjectSelectorComponent,
  ],
  exports: [
    IonicDateTimePickerComponent,
    UsTypeSelectorComponent,
    FormPlanSelectorComponent,
    FormProfileSelectorComponent,
    UsSelectorComponent,
    FaitSelectorComponent,
    DimensionInputComponent,
    SondageSelectorComponent,
    ValidCancelGroupedBtnComponent,
    CastorTypeSelectorComponent,
    CastorTagInputComponent,
    CastorProjectUserSelectionComponent,
    CastorFileInputComponent,
    CastorObjectSelectorComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    PipesModule,
    DirectiveModule,
    MatListModule,
    MatButtonModule,
    DisplayModule,
    NgOptimizedImage,
    ScrollingModule,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
  ]
})
export class InputsModule { }
