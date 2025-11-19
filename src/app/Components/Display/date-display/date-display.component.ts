import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {formatDate} from "@angular/common";

@Component({
  selector: 'app-date-display',
  templateUrl: './date-display.component.html',
  styleUrls: ['./date-display.component.scss']
})
export class DateDisplayComponent implements OnInit, OnChanges {

  @Input() dateTimeTitleLabel: string;
  @Input() date: number;

  displayedDate: string;

  constructor() { }

  ngOnInit(): void {
    this.formatDisplayDate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.date) {
      this.formatDisplayDate();
    }
  }

  formatDisplayDate() {
    if (this.date) {
      this.displayedDate = formatDate(this.date, "dd MMM YYYY HH:mm", 'fr-FR');
    }
  }

}
