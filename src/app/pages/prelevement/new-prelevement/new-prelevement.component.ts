import {Component, OnInit} from '@angular/core';
import {Location} from "@angular/common";

@Component({
  selector: 'app-new-prelevement',
  templateUrl: './new-prelevement.component.html',
  styleUrls: ['./new-prelevement.component.scss']
})
export class NewPrelevementComponent implements OnInit {

  constructor(private location: Location) { }

  ngOnInit(): void {
  }

  goBack() {
    this.location.back();
  }

}
