import {Component, OnInit} from '@angular/core';
import {Location} from "@angular/common";

@Component({
  selector: 'app-new-fait',
  templateUrl: './new-fait.component.html',
  styleUrls: ['./new-fait.component.scss']
})
export class NewFaitComponent implements OnInit {


  constructor(private location: Location) {
  }

  ngOnInit(): void {

  }

  goBack() {
    this.location.back();
  }

}
