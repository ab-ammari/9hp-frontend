import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {ApiDbTable, ApiSyncableObject} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {LinkDataclass} from "../../../DataClasses/CastorLinkDataclass";
import {getTableDescription, tableDescription} from "../../../DataClasses/models/sync-obj-utilities";
import {LOG, LoggerContext} from "ngx-wcore";
import {Subject} from "rxjs";
import {debounceTime, filter, takeUntil, tap} from "rxjs/operators";

const CONTEXT: LoggerContext = {
  origin: 'GenericLinkedObjectTagListComponent'
};
const TAG_LIST_DEBUG = false;
const debugLog = (action: string, ...payload: unknown[]) => {
  if (!TAG_LIST_DEBUG) {
    return;
  }
  LOG.debug.log({...CONTEXT, action}, ...payload);
};

@Component({
  selector: 'app-generic-linked-object-tag-list',
  templateUrl: './generic-linked-object-tag-list.component.html',
  styleUrls: ['./generic-linked-object-tag-list.component.scss']
})
export class GenericLinkedObjectTagListComponent implements OnInit, OnChanges, OnDestroy {

  @Input() object: dbBoundObject<ApiSyncableObject>;
  @Input() link_table: string;

  target_list: Array<dbBoundObject<ApiSyncableObject>>;

  private readonly $destroyer: Subject<void> = new Subject();
  private readonly retrieveTargetObjectsPipe: Subject<void> = new Subject<void>();
  constructor(private w: WorkerService) {
  }

  ngOnInit(): void {
    debugLog('ngOnInit', this.object, this.link_table);
    this.retrieveTargetObjectsPipe.pipe(
      takeUntil(this.$destroyer),
      filter((t) => !!(this.object && this.link_table)),
      debounceTime(50),
      tap(() => {
        debugLog('retrieveTargetObjects', this.object.uuid);
        const link_info: tableDescription = getTableDescription(this.link_table as ApiDbTable);
        const obj_uuid_path: string = this.object.info.uuid_paths[0];
        const link: LinkDataclass<ApiSyncableObject> = this.w.data().links[this.link_table];

        if (link) {
          const target_info: tableDescription
            = getTableDescription(link_info.linked_tables.find(table => table !== this.object.info.ref_table));
          const link_filtered_list = link.all.list.filter(l => l.item[obj_uuid_path] === this.object.item[obj_uuid_path]);
          //  LOG.debug.log({...CONTEXT, action: 'retrieveTargetObjects'}, link_filtered_list);
          this.target_list = link_filtered_list.map(l => {
            const target_uuid = l.item[target_info.uuid_paths[0]];

            let resolved_obj = null;
            if (this.w.data().objects[target_info.ref_table]?.all?.list?.length > 0) {
              resolved_obj = this.w.data().objects[target_info.ref_table].all.list.find((obj: dbBoundObject<ApiSyncableObject>) => {
                return (obj.item[target_info.uuid_paths[0]] === target_uuid)
              });
            }
            return resolved_obj;
          })
        }
      })
    ).subscribe();
    this.retrieveTargetObjects();
  }

  ngOnChanges(changes: SimpleChanges) {
      this.retrieveTargetObjects();
  }

  ngOnDestroy() {
    this.$destroyer.next();
  }

  private retrieveTargetObjects() {
    this.retrieveTargetObjectsPipe.next();
  }


}
