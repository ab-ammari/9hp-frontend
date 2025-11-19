import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-castor-tag-input',
  templateUrl: './castor-tag-input.component.html',
  styleUrls: ['./castor-tag-input.component.scss']
})
export class CastorTagInputComponent implements OnInit {
  @Input() description: string;
  @Input() title: string;
  @Input() disable: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

}
