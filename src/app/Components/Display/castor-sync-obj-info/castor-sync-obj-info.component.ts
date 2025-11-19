import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {ApiSyncableObject} from "../../../../../shared";
import {Subject} from "rxjs";
import {takeUntil, tap} from "rxjs/operators";
import {v4} from "uuid";

@Component({
  selector: 'app-castor-sync-obj-info',
  templateUrl: './castor-sync-obj-info.component.html',
  styleUrls: ['./castor-sync-obj-info.component.scss']
})
export class CastorSyncObjInfoComponent implements OnInit, OnDestroy {

  @Input() object: dbBoundObject<ApiSyncableObject>;

  item: ApiSyncableObject;
  versions: Array<ApiSyncableObject>;
  previousValidVersion: ApiSyncableObject;

  $subscriber: Subject<unknown> = new Subject<unknown>();

  id: string;

  constructor() {
  }

  ngOnInit(): void {
    this.id = v4();
    this.init(this.object.item);
    this.object.onValueChange().pipe(
      takeUntil(this.$subscriber),
      tap((item) => {
        this.init(item);
      })
    ).subscribe();
  }

  ngOnDestroy() {
    this.$subscriber.next(true);
  }

  init(item) {
    this.item = item;
    this.object.getAvailableVersions().pipe(
      tap(value => {
        this.versions = value;
        if (value.length > 0){
          this.previousValidVersion = value.filter(x => !x.draft).find(x => x.created < item.created);
        } else {
          this.previousValidVersion = null;
        }
      })
    ).subscribe();
  }

  discardItem($event) {
    $event.stopPropagation();
    this.object.discard_draft();
  }
}
