import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {ApiSyncable, ApiSyncableObject, ApiUser} from "../../../../../shared";

@Component({
  selector: 'app-fiche-form',
  templateUrl: './fiche-form.component.html',
  styleUrls: ['./fiche-form.component.scss']
})
export class FicheFormComponent implements OnInit, OnChanges {

  @Input() object: ApiSyncableObject;
  createdDate: number;

  constructor() { }

  ngOnInit(): void {
    this.createdDate = this.getCreationDate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.object) {
      this.createdDate = this.getCreationDate();
    }
  }

  getCreationDate(): number {
    return this.object.versions?.length ? this.object.versions.reduce(
      (previousValue, currentValue, currentIndex, array) => {
        if (!previousValue) {
          return currentValue;
        } else {
          if (currentValue.created < previousValue.created) {
            return currentValue;
          } else {
            return previousValue;
          }
        }
      }).created : this.object?.created;
  }

}
