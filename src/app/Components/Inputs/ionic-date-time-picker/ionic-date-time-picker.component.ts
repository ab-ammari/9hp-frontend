import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {formatDate} from "@angular/common";
import {IonModal} from "@ionic/angular";

@Component({
  selector: 'app-ionic-date-time-picker',
  templateUrl: './ionic-date-time-picker.component.html',
  styleUrls: ['./ionic-date-time-picker.component.scss'],
})
export class IonicDateTimePickerComponent implements OnInit {

  @ViewChild('dateTimeModal') timeModal: IonModal;

  @Input() dateTimeTitleLabel: string;
  @Input() ionicMinDate: string;
  @Input() ionicMaxDate: string;

  @Input() datePicked: string;
  @Output() datePickedChange = new EventEmitter();

  @Input() disabled: boolean;
  @Output() disabledChange = new EventEmitter();

  displayedDate: string;

  constructor() { }

  ngOnInit() {
    if (!this.datePicked) {
      this.datePicked = formatDate(new Date(), 'YYYY-MM-ddTHH:mm:ss', 'fr-FR');
      this.datePickedChange.emit(this.datePicked);
      console.log("DATE PICKED UPDATE :: ", this.datePicked);
      this.formatDate();
    } else {
      this.formatDate();
    }
  }

  presentModal() {
    this.timeModal?.present();
  }

  formatDate() {
    this.displayedDate = formatDate(this.datePicked, "dd MMM YYYY HH:mm", 'fr-FR');
    console.log("Displayed date :: ", this.displayedDate);
  }

  dateChange(event: string) {
    console.log("Date change ", event);
    this.formatDate();
    this.datePicked = event;
    this.datePickedChange.emit(event);
  }

}
