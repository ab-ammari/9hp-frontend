import {Component, OnInit} from '@angular/core';
import {Location} from "@angular/common";

@Component({
  selector: 'app-new-minute',
  templateUrl: './new-minute.component.html',
  styleUrls: ['./new-minute.component.scss']
})
export class NewMinuteComponent implements OnInit {


  constructor(private location: Location) {
  }

  ngOnInit(): void {
  }

  goBack() {
    this.location.back();
  }

}
