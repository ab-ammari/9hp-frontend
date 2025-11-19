import {Component, OnInit} from '@angular/core';
import {Location} from "@angular/common";
import {LoggerContext} from "ngx-wcore";

const CONTEXT: LoggerContext = {
  origin: 'NewPhotoComponent'
}

@Component({
  selector: 'app-new-photo',
  templateUrl: './new-photo.component.html',
  styleUrls: ['./new-photo.component.scss']
})
export class NewPhotoComponent implements OnInit {

  constructor(
    private location: Location,
  ) {
  }

  ngOnInit(): void {
  }

  goBack() {
    this.location.back();
  }

}
