import {
  AfterViewInit,
  Component,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {ApiDbTable, ApiSyncableObject} from "../../../../../shared";
import {getTableDescription, tableDescription} from "../../../DataClasses/models/sync-obj-utilities";
import {v4} from "uuid";
import {LOG, LoggerContext} from "ngx-wcore";
import {WorkerService} from "../../../services/worker.service";
import {A} from "../../../Core-event";
import {AlertController, IonPopover, PopoverController} from "@ionic/angular";
import {BehaviorSubject, Subject, throttleTime, timer} from "rxjs";
import {debounce, debounceTime, takeUntil, tap} from "rxjs/operators";
import {ObjectDataclass} from "../../../DataClasses/CastorObjectDataclass";
import {createDebouncedCallback} from "../../../util/utils";

const CONTEXT: LoggerContext = {
  origin: 'CastorTagDisplayComponent'
}

@Component({
  selector: 'app-castor-tag-display',
  templateUrl: './castor-tag-display.component.html',
  styleUrls: ['./castor-tag-display.component.scss']
})
export class CastorTagDisplayComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {

  @Input() object: ApiSyncableObject;
  @Input() description: { table: ApiDbTable, uuid: string };

  @Input() infoBulle: boolean = false;
  @Input() mainTag: boolean = false;
  @Input() popover: boolean = true;

  @ViewChild('tagPopover') tagPopover: IonPopover;


  object_uuid: string;
  CopyToClipboardActionMessage: string;

  info: tableDescription;

  id: string = v4();
  buttonHasMouse: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  contentHasMouse: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  popoverIsVisible: boolean = false;

  $subscriber: Subject<void> = new Subject();
  ApiDbTable = ApiDbTable;

  constructor(
    private w: WorkerService,
    private popoverController: PopoverController,
    private alertController: AlertController,
    private zone: NgZone
  ) {
  }

  ngOnInit(): void {
    this.contentHasMouse.pipe(
      takeUntil(this.$subscriber),
      debounceTime(300),
      tap(() => {
        this.popoverIsVisible = (this.contentHasMouse.value || this.buttonHasMouse.value);
        this.togglePopover();
      })
    ).subscribe();
    this.buttonHasMouse.pipe(
      takeUntil(this.$subscriber),
      debounceTime(300),
      tap(() => {
        this.popoverIsVisible = (this.contentHasMouse.value || this.buttonHasMouse.value);
        this.togglePopover();
      })
    ).subscribe();

    this.w.data().objects.onReady.pipe(
      takeUntil(this.$subscriber),
      tap(() => {
        this.initInfo();
      })).subscribe();
  }

  ngAfterViewInit() {
    LOG.debug.log({...CONTEXT, action: 'ngAfterViewInit'});
  }

  togglePopover() {
    if (this.tagPopover) {
      if (this.popoverIsVisible) {
        if (this.tagPopover.isOpen) {
          // already open
        } else {
          this.tagPopover.present();
        }
      } else {
        if (this.tagPopover.isOpen) {
          this.tagPopover.dismiss();
        } else {
          // already closed
        }
      }
    } else {
      LOG.debug.log({...CONTEXT, action: 'toggle popover', message: 'Doesn\'t exist yet ?'}, this.popover);
    }
  }

  ngOnDestroy() {
    this.$subscriber.next();
  }

  ngOnChanges(changes: SimpleChanges) {
        this.initInfo();
  }

  initInfo = createDebouncedCallback(() => {
      if (this.object) {
        this.info = getTableDescription(this.object?.table);
        // LOG.debug.log({...CONTEXT, action: 'initInfo', message: 'with object'}, this.info, this.object);
      } else if (this.description) {
        this.info = getTableDescription(this.description.table);
        // LOG.debug.log({...CONTEXT, action: 'initInfo'}, this.description);
        //   LOG.debug.log({...CONTEXT, action: 'initInfo'}, this.w.data().forTable(this.info.ref_table).all.list);
        this.object = (
          this.w.data().forTable(this.info.ref_table) as ObjectDataclass<ApiSyncableObject>
        )?.all?.findByUuid(this.description.uuid).item;
        // LOG.debug.log({...CONTEXT, action: 'initInfo', message: ' with description'}, this.info, this.object);
      } else {
        LOG.warn.log({...CONTEXT, action: 'initInfo', message: 'no info'}, this.info, this.object, this.description);
      }

      this.object_uuid = this.object ? this.object[this.info.uuid_paths[0]] : null;
      if (this.object && this.object['tag_custom'] ) {
        this.object_uuid = this.object['tag_custom'];
      }

      if (!this.object_uuid) {
        LOG.error.log({...CONTEXT, action: 'initInfo() {'}, this.object, this.description,  this.info);
      }

  }, 0);


  goToObjectPage(object: ApiSyncableObject, newTab: boolean = false) {
    if (object) {
      this.w.trigger(A.requestNavigateToObject, {object: object, newTab: newTab});
      // Close fantome popover
      setTimeout(() => {
        this.closePopup();
      }, 300);
    }
  }

  openPopup() {
    this.tagPopover.present();
  }

  copyToClipboard() {
    if (!this.CopyToClipboardActionMessage) {
      navigator.clipboard.writeText(this.object_uuid).then(() => {
        this.CopyToClipboardActionMessage = 'text copied successfully';
      }).catch(() => {
        this.CopyToClipboardActionMessage = 'unexpected error';
      }).finally(() => {
        setTimeout(() => {
          this.CopyToClipboardActionMessage = null;
        }, 2500);
      });
    }
  }

  async closeInfoBullePopup() {
    if (this.infoBulle) {
      if (await this.popoverController?.getTop()) await this.popoverController?.dismiss();
    }
  }

  async closePopup() {
    if (await this.popoverController?.getTop()) await this.popoverController?.dismiss();
  }

  async createDuplicates(obj: ApiSyncableObject) {
    const alert = await this.alertController.create({
      header: 'Duplicate item',
      buttons: [
        {
          text: 'CANCEL',
          role: 'cancel',
        },{
        text: 'Create',
        role: 'ok'
      } ],
      inputs: [
        {
          type: 'number',
          label: 'Count',
          placeholder: 'Duplicates',
          min: 1,
          max: 1000,
          value: 100
        },
      ],
    });

    await alert.present();
    alert.onWillDismiss().then((result) => {
      LOG.debug.log({...CONTEXT, action: 'createDuplicates'},result);
      if (result.role === 'ok') {
        const info = getTableDescription(obj.table);
        const length: number = Number(result?.data?.values[0]) ?? 0;
        let duplicates: Array<ApiSyncableObject> = new Array(length).fill({
          ...obj,
          live: true,
          draft: true,
          error: null,
          created: null,
          [info.uuid_paths[0]]: null,
          versions: null,
          tag: null,
          tag_detail: null,
          tag_increment: null,
          tag_hash: null,
          author_uuid: this.w.data().user.user_uuid,
        } as ApiSyncableObject );
        LOG.debug.log({...CONTEXT, action: 'createDuplicates'}, duplicates, length);
        this.w.bulkCommit(duplicates).pipe(
          tap((val) => {
          LOG.debug.log({...CONTEXT, action: 'createDuplicates'}, val);
        })).subscribe();
      }
    })
  }

}
