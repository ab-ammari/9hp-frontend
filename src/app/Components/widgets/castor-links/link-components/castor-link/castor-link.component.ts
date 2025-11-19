import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {dbBoundObject} from "../../../../../DataClasses/models/db-bound-object";
import {ApiDbTable, ApiSyncableObject} from "../../../../../../../shared";
import {WorkerService} from "../../../../../services/worker.service";
import {LOG, LoggerContext} from "ngx-wcore";
import {Subject, timer} from "rxjs";
import {LinkList, LinkSelection} from "../../../../../services/castor-object-context.service";
import {DB} from "../../../../../Database/DB";
import {debounce, debounceTime, takeUntil, tap} from "rxjs/operators";

const CONTEXT: LoggerContext = {
  origin: 'CastorLinkComponent'
}

@Component({
  selector: 'app-castor-link',
  templateUrl: './castor-link.component.html',
  styleUrls: ['./castor-link.component.scss']
})
export class CastorLinkComponent implements OnInit, OnChanges, OnDestroy {

  @Input() reference: dbBoundObject<ApiSyncableObject>;
  @Input() target: LinkSelection;

  link_list: LinkList;

  $subscriber: Subject<null> = new Subject<null>();

  initSubscriber: Subject<any> = new Subject();

  constructor(public w: WorkerService) {
  }

  ngOnInit(): void {
    this.init();
    this.initSubscriber.pipe(
      takeUntil(this.$subscriber),
      debounceTime(500),
      tap(() => this.init())
    ).subscribe();
    DB.database.on_change.pipe(
          takeUntil(this.$subscriber),
          debounce(() => timer(1000)),
          tap(() => this.initSubscriber.next(null))
      ).subscribe();
    this.target.links?.onValueChange().pipe(
      takeUntil(this.$subscriber),
      debounce(() => timer(1000)),
      tap(() => this.initSubscriber.next(null))
    ).subscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.initSubscriber.next(null);
  }

  ngOnDestroy() {
    this.$subscriber.next(undefined);
  }

  init() {
      const ref_uuid_path = this.reference.info.uuid_paths[0];
      const target_uuid_path = this.target.info.uuid_paths[0];
      this.link_list = {
          target: this.target.info,
          relation: this.target.link_info,
          reference: this.reference.info,
          list: []
      };
      LOG.debug.log({
          ...CONTEXT,
          action: 'available_target_list'
      }, this.target.info, this.w.data().objects[this.target.info.ref_table].all.list);
      LOG.debug.log({...CONTEXT, action: 'create link list', message: ''}, this.target.links?.list);

      this.target.links?.list?.filter(
          item => item.item[ref_uuid_path] === this.reference.item[ref_uuid_path]
      ).forEach(link => {
        LOG.debug.log({...CONTEXT}, ref_uuid_path, target_uuid_path, this.reference.uuid, this.target.info.ref_table);

        const target_obj: dbBoundObject<ApiSyncableObject>
              = this.w.data().objects[this.target.info.ref_table].all.list
              .find(obj => obj.item[target_uuid_path] === link.item[target_uuid_path]);
          if (target_obj &&
              (target_obj.info.obj_table === this.target.info.obj_table
              || (target_obj.info.ref_table === ApiDbTable.us && target_obj.info.ref_table === this.target.info.ref_table))
          ) {
              this.link_list.list.push({
                  relation: link,
                  reference: this.reference,
                  target: target_obj
              });
          } else {
            LOG.warn.log({...CONTEXT, action: 'init', message: 'Couldnt find target object'}, target_obj, target_uuid_path, this.target.info.ref_table, this.target);
          }
      });
      LOG.debug.log({...CONTEXT, action: 'init()'}, this.link_list);

  }

}
