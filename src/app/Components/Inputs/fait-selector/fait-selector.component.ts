import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {ApiFait, ApiSyncableObject} from "../../../../../shared";
import {DB} from "../../../Database/DB";
import {debounce, takeUntil, tap} from "rxjs/operators";
import {Subject, timer} from "rxjs";
import {LOG, LoggerContext} from "ngx-wcore";


const CONTEXT: LoggerContext = {
  origin: 'FaitSelectorComponent'
};
@Component({
  selector: 'app-fait-selector',
  templateUrl: './fait-selector.component.html',
  styleUrls: ['./fait-selector.component.scss']
})
export class FaitSelectorComponent implements OnInit, OnChanges, OnDestroy {

  @Input() faitArray: Array<dbBoundObject<ApiFait>>;
  @Input() secteur_uuid: string;

  @Input() selectedFait: dbBoundObject<ApiFait>;
  @Output() selectedFaitChange = new EventEmitter<dbBoundObject<ApiFait>>();

  @Input() DisplaySuffix: boolean = false;
  @Input() disableSuffix: boolean = false;
  @Input() enabled: boolean = true;
  @Output() enabledChange = new EventEmitter();

  fait_list: Array<ApiFait>;

  $subscriber: Subject<boolean> = new Subject<boolean>();
  faitFilter = (fait: ApiFait) => {
    return !this.secteur_uuid || fait.secteur_uuid === this.secteur_uuid;
  };

  constructor() {
    LOG.debug.log({...CONTEXT, action: 'constructor'});

  }

  ngOnInit(): void {
    DB.database.on_change.pipe(
      takeUntil(this.$subscriber),
      debounce(() => timer(1000)),
      tap(() => {
        this.init();
      })).subscribe();

    LOG.debug.log({...CONTEXT, action: 'ngOnInit'});
  }

  ngOnChanges(changes: SimpleChanges) {
    //LOG.debug.log({...CONTEXT, action: 'ngOnChanges'});

    this.init();
  }

  ngOnDestroy() {
    this.$subscriber.next(true);
  }

  init() {

   // LOG.debug.log({...CONTEXT, action: 'init', message: 'start'}, this.faitArray);
      this.fait_list = this.faitArray?.map(item => item.item);

   // LOG.debug.log({...CONTEXT, action: 'init', message: 'end'}, this.fait_list);
  }

  toggleEnabled($event) {
    this.enabled =! this.enabled;
    if (!this.enabled){
      this.selectedFait = null;
    }
    this.enabledChange.emit(this.enabled);
    $event.stopPropagation();
  }
}
