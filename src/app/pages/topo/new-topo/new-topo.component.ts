import {Component, OnInit} from '@angular/core';
import {Location} from "@angular/common";

@Component({
  selector: 'app-new-topo',
  templateUrl: './new-topo.component.html',
  styleUrls: ['./new-topo.component.scss']
})
export class NewTopoComponent implements OnInit {

  constructor(private location: Location) {
  }

  ngOnInit(): void {
  }

  goBack() {
    this.location.back();
  }

}
