import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-draft-status-item',
  templateUrl: './draft-status-item.component.html',
  styleUrls: ['./draft-status-item.component.scss']
})
export class DraftStatusItemComponent implements OnInit, OnChanges {

  @Input() itemLabel: string;
  @Input() itemDraftStatus: boolean;
  @Input() conflicts: Array<unknown>;

  alertClass: string | string[] | Set<string> | {
    [klass: string]: any;
  }

  constructor() { }

  ngOnInit(): void {
   this.initAlertColor();
  }

  initAlertColor() {
    if (this.conflicts && this.conflicts.length > 0) {
      this.alertClass = 'alert-danger';
    } else if (this.itemDraftStatus) {
      this.alertClass = 'alert-warning';
    } else {
      this.alertClass = 'alert-success';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.itemDraftStatus || changes?.conflicts) {
      this.initAlertColor();
    }
  }

}
