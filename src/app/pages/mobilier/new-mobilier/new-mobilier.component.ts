import {Component, OnInit} from '@angular/core';
import {Location} from "@angular/common";

@Component({
  selector: 'app-new-mobilier',
  templateUrl: './new-mobilier.component.html',
  styleUrls: ['./new-mobilier.component.scss']
})
export class NewMobilierComponent implements OnInit {

  constructor(private location: Location) { }

  ngOnInit(): void {
  }


  goBack() {
    this.location.back();
  }

}
