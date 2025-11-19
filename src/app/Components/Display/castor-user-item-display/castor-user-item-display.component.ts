import {Component, Input, OnInit} from '@angular/core';
import {ApiUs, ApiUser} from "../../../../../shared";

@Component({
  selector: 'app-castor-user-item-display',
  templateUrl: './castor-user-item-display.component.html',
  styleUrls: ['./castor-user-item-display.component.scss']
})
export class CastorUserItemDisplayComponent implements OnInit {

  @Input() user: ApiUser;

  constructor() { }

  ngOnInit(): void {
  }

}
