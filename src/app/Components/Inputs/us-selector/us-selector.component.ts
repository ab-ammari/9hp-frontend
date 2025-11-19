import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {ApiUs} from "../../../../../shared";

@Component({
  selector: 'app-us-selector',
  templateUrl: './us-selector.component.html',
  styleUrls: ['./us-selector.component.scss']
})
export class UsSelectorComponent implements OnInit {

  @Input() usArray: Array<dbBoundObject<ApiUs>> | undefined;

  @Input() selectedUs: dbBoundObject<ApiUs>;
  @Output() selectedUsChange = new EventEmitter<dbBoundObject<ApiUs>>();

  @Input() DisplaySuffix: boolean = false;
  @Input() disableSuffix: boolean = false;
  @Input() enabled: boolean = true;
  @Output() enabledChange = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
    console.log("us array :::", this.usArray)
  }

  toggleEnabled($event) {
    this.enabled =! this.enabled;
    if(!this.enabled) {
      this.selectedUs = null;
      this.selectedUsChange.emit(this.selectedUs);
    }
    this.enabledChange.emit(this.enabled);
    $event.stopPropagation();
  }

  onNewUsSelected(us: dbBoundObject<ApiUs>) {
    this.selectedUs = us;
    this.selectedUsChange.emit(this.selectedUs);
  }
}
