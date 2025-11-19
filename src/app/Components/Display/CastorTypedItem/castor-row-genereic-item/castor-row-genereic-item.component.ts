import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {dbBoundObject} from "../../../../DataClasses/models/db-bound-object";
import {ApiSyncableObject} from "../../../../../../shared";
import {Subject} from "rxjs";
import {takeUntil, tap} from "rxjs/operators";

@Component({
  selector: 'app-castor-row-genereic-item',
  templateUrl: './castor-row-genereic-item.component.html',
  styleUrls: ['./castor-row-genereic-item.component.scss']
})
export abstract class CastorRowGenereicItemComponent implements OnInit, OnChanges, OnDestroy {

  @Input() object: dbBoundObject<ApiSyncableObject>;

  $subscriber: Subject<unknown> = new Subject<unknown>();

  protected constructor() {
  }

  ngOnInit(): void {
    this.init(this.object.item);
    this.object.onValueChange().pipe(
      takeUntil(this.$subscriber),
      tap((value) => this.init(value))
    ).subscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.object) {
      this.init(this.object.item);
    }
  }

  ngOnDestroy() {
    this.$subscriber.next(true);
  }

  abstract init(object: ApiSyncableObject);

}
