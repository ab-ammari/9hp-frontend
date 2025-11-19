import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SortDirective} from "./sort.directive";
import { LinkActiveDirective } from './link-active.directive';
import { ClickStopPropagationDirective } from './click-stop-propagation.directive';



@NgModule({
  declarations: [
    SortDirective,
    LinkActiveDirective,
    ClickStopPropagationDirective
  ],
  exports: [
    SortDirective,
    ClickStopPropagationDirective
  ],
  imports: [
    CommonModule
  ]
})
export class DirectiveModule { }
