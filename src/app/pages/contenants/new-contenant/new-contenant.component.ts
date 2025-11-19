import {Component, OnInit} from '@angular/core';
import {Location} from "@angular/common";

@Component({
  selector: 'app-new-contenant',
  templateUrl: './new-contenant.component.html',
  styleUrls: ['./new-contenant.component.scss']
})
export class NewContenantComponent implements OnInit {

  constructor(private location: Location) { }

  ngOnInit(): void {
  }

  goBack() {
    this.location.back();
  }

}
