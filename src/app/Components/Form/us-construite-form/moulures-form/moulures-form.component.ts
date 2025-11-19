import {Component, Input} from '@angular/core';
import {ApiUsConstruite} from "../../../../../../shared";

@Component({
  selector: 'app-moulures-form',
  templateUrl: './moulures-form.component.html',
  styleUrls: ['./moulures-form.component.scss']
})
export class MouluresFormComponent {
  @Input() us: ApiUsConstruite;
}
