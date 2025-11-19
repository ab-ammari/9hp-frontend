import {Component, Input} from '@angular/core';
import {ApiTypeCategory, ApiUsConstruite} from "../../../../../../shared";

@Component({
  selector: 'app-appareil-form',
  templateUrl: './appareil-form.component.html',
  styleUrls: ['./appareil-form.component.scss']
})
export class AppareilFormComponent {

  @Input() us: ApiUsConstruite;

  protected readonly ApiTypeCategory = ApiTypeCategory;

  isNoAppareil() {
    return this.us?.us_structure_appareil === "2a44fe10-bc80-41c4-9746-7a0204e3c6e9";
  }
}
