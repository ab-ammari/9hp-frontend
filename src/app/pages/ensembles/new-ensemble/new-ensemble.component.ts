import {Component, OnInit} from '@angular/core';
import {Location} from "@angular/common";

@Component({
  selector: 'app-new-ensemble',
  templateUrl: './new-ensemble.component.html',
  styleUrls: ['./new-ensemble.component.scss']
})
export class NewEnsembleComponent implements OnInit {

  constructor(private location: Location) { }

  ngOnInit(): void {
  }

  goBack() {
    this.location.back();
  }

}
