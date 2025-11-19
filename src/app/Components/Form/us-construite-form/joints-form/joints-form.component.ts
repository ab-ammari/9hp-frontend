import {Component, Input} from '@angular/core';
import {ApiTypeCategory, ApiUsConstruite} from "../../../../../../shared";

@Component({
  selector: 'app-joints-form',
  templateUrl: './joints-form.component.html',
  styleUrls: ['./joints-form.component.scss']
})
export class JointsFormComponent {

  @Input() us: ApiUsConstruite;

  protected readonly ApiTypeCategory = ApiTypeCategory;
}
