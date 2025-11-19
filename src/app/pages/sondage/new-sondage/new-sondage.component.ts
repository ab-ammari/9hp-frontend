import { Component, OnInit } from '@angular/core';
import {Location} from "@angular/common";

@Component({
  selector: 'app-new-sondage',
  templateUrl: './new-sondage.component.html',
  styleUrls: ['./new-sondage.component.scss']
})
export class NewSondageComponent implements OnInit {

  constructor(private location: Location) { }

  ngOnInit(): void {
  }

  goBack() {
    this.location.back();
  }

}
