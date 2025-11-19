import {Component, Input} from '@angular/core';
import {ApiUsConstruite} from "../../../../../../shared";

@Component({
  selector: 'app-remplois-form',
  templateUrl: './remplois-form.component.html',
  styleUrls: ['./remplois-form.component.scss']
})
export class RemploisFormComponent {
  @Input() us: ApiUsConstruite;
}
