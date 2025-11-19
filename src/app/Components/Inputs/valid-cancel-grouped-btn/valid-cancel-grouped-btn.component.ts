import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Location} from "@angular/common";

@Component({
  selector: 'app-valid-cancel-grouped-btn',
  templateUrl: './valid-cancel-grouped-btn.component.html',
  styleUrls: ['./valid-cancel-grouped-btn.component.scss']
})
export class ValidCancelGroupedBtnComponent implements OnInit {

  @Output() validCallBackBtn = new EventEmitter();
  @Output() cancelCallbackBtn = new EventEmitter();

  @Input() disableValidBtn: boolean;
  @Input() disableCancelBtn: boolean;

  @Input() cancelBackMode: boolean = false;

  constructor(private location: Location) { }

  ngOnInit(): void {
  }

  onCancelClick(even: Event) {
    if (this.cancelBackMode) {
      this.location.back();
    } else {
      this.cancelCallbackBtn.emit(even);
    }
  }

}
