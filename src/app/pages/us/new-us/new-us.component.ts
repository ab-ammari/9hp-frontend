import {Component, OnInit} from '@angular/core';
import {Location} from "@angular/common";

@Component({
  selector: 'app-new-us',
  templateUrl: './new-us.component.html',
  styleUrls: ['./new-us.component.scss']
})
export class NewUsComponent implements OnInit {

  constructor(private location: Location) {
  }

  ngOnInit(): void {
  }

  goBack() {
    this.location.back();
  }

}
