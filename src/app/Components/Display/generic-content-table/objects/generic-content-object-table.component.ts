import {
  Component,
  EventEmitter,
  Input,
  isDevMode,
  OnChanges, OnDestroy,
  OnInit,
  Output, Renderer2,
  SimpleChanges, TrackByFunction,
  ViewChild
} from '@angular/core';
import {
  ApiDbTable,
  ApiEchantillonMobilier,
  ApiFait,
  ApiSecteur,
  ApiSyncableObject,
  ApiSyncableType,
  ApiUs
} from "../../../../../../shared";
import {dbBoundObject} from "../../../../DataClasses/models/db-bound-object";
import {LOG, LoggerContext} from "ngx-wcore";
import {WorkerService} from "../../../../services/worker.service";
import {DEV} from "../../../../util/dev";
import {CdkVirtualScrollViewport} from "@angular/cdk/scrolling";
import {debounce, debounceTime, share, takeUntil, tap} from "rxjs/operators";
import {ToastService} from "../../../../services/toast.service";
import {Subject} from "rxjs";

const CONTEXT: LoggerContext = {
  origin: 'GenericContentObjectTableComponent'
}

@Component({
  selector: 'app-generic-content-object-table',
  templateUrl: './generic-content-object-table.component.html',
  styleUrls: ['./generic-content-object-table.component.scss']
})
export class GenericContentObjectTableComponent implements OnInit, OnChanges, OnDestroy {

  @Input() content: genericContentDescription;
  @Input() global_filter: string;
  @Input() dataReady: boolean = false;
  filtered_items: Array<dbBoundObject<ApiSyncableObject>> = [];

  @Output() onSelect: EventEmitter<dbBoundObject<ApiSyncableObject>> = new EventEmitter<dbBoundObject<ApiSyncableObject>>();

  ApiDbTable = ApiDbTable;
  @ViewChild(CdkVirtualScrollViewport, { static: true })
  public viewPort: CdkVirtualScrollViewport;

  public get inverseOfTranslation(): string {
    if (!this.viewPort) {
      return '-0px';
    }
    const offset = this.viewPort.getOffsetToRenderedContentStart();

    return `-${offset}px`;
  }

  filterSubject: Subject<null> = new Subject<any>();
  $subscriber: Subject<null> = new Subject();
  private initialized = false;
  constructor(
    public w: WorkerService,
    private toast: ToastService,
    private renderer: Renderer2
  ) {
  }

  ngOnInit(): void {
    this.filterSubject.pipe(
      takeUntil(this.$subscriber),
      debounceTime(1000),
      tap(() => {
        this.onFilter();
      })
    ).subscribe();
    this.initialized = true;
    this.syncFilteredItems();
  }
  ngOnDestroy() {
    this.$subscriber.next(null);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.syncFilteredItems();
  }

  onClick(item: dbBoundObject<ApiSyncableObject>) {
    this.onSelect.emit(item);
  }

  private syncFilteredItems() {
    if (!this.content?.content) {
      this.filtered_items = [];
      return;
    }

    if (!this.dataReady) {
      this.filtered_items = [...this.content.content];
      return;
    }

    if (!this.initialized) {
      this.onFilter();
      return;
    }

    this.filterSubject.next(null);
  }

  private onFilter() {
    if (!this.content?.content) {
      this.filtered_items = [];
      return;
    }

    if (!this.dataReady) {
      this.filtered_items = [...this.content.content];
      return;
    }

    LOG.debug.log({...CONTEXT, action: 'onFilter'});
    console.time('onFilter');
    this.filtered_items = this.content?.content?.filter(item => {
      return this.content?.headers.filter(head => {
        const filter = head.filter ?? '';
        if (!filter || filter === '') {
          return true;
        } else {
          const value = (item.item[head.key] ?? '');
          LOG.debug.log({...CONTEXT, action: 'onFilter value '}, value);
          if (head.format) {
            switch (head.format) {
              case "string":
                const valueString = value as string;
                return !!valueString.toUpperCase().includes(filter.toUpperCase());
              case "number":
                return !!value.toString().includes(filter);
              case "info":
                const info: string = (item.info[head.key] ?? '');
                return !!info.toUpperCase().includes(filter.toUpperCase());
              case "tag":
                const uuid: string = item.item[item.info.uuid_paths[0]];
                const uuidValue: string = value;
                const tag: string = item.item['tag'];
                return tag ? tag.toUpperCase().includes(filter.toUpperCase()) :
                  (uuidValue.toUpperCase().includes(filter.toUpperCase())
                  || uuid.toUpperCase().includes(filter.toUpperCase()));
              case "type":
                const type: ApiSyncableType = this.w.data().types.list.find(type => type.type_uuid === value);
                return !!(type?.type_label?.toUpperCase().includes(filter.toUpperCase()));
              case "SECTOR":
                const sector: ApiSecteur = this.w.data().objects.secteur.all?.list
                  ?.find(sector => sector.item.secteur_uuid === value).item;
                return !!(sector.tag.toUpperCase().includes(filter.toUpperCase()));
              case "user":
                const user = this.w.data().projet.selected.item.users.find(x => x.user_uuid === value);
                return !!(user.user_first_name.toUpperCase() + user.user_last_name.toUpperCase() + user.user_uuid.toUpperCase()).includes(filter.toUpperCase());
              case "US":
                const us: ApiUs = this.w.data().objects.us.all?.list?.find(us => us.item.us_uuid === value).item;
                return !!(us?.tag?.toUpperCase().includes(filter.toUpperCase()));
              case "usFait":
                const usFait: ApiFait = this.w.data().objects.fait?.all?.list
                  ?.find(fait => this.w.data().objects.us.all?.list
                    ?.find(us => us.item.us_uuid === value)?.item?.fait_uuid === fait.item.fait_uuid)?.item;
                return !!(usFait?.tag?.toUpperCase().includes(filter.toUpperCase()));
              case "boolean":
                // TODO : DO BETTER
                const bool: boolean = (filter === 'Oui' || filter === 'oui');
                return (bool === item.item[head.key]);
              default:
                return true;
            }
          } else if (head.specialDisplay) {
            switch (head.specialDisplay) {
              case "author":
                const user = this.w.data().projet.selected.item.users.find(x => x.user_uuid === value);
                return !!(user.user_first_name + user.user_last_name + user.user_uuid).includes(filter);
              case "contenu":
                return !!value.includes(filter)
              case "usDatation":
                const usMobilier = this.w.data().objects.echantillon.all
                  ?.childList(ApiDbTable.echantillon_mobilier)
                  ?.find(mobilier => mobilier.item.us_uuid === value) as dbBoundObject<ApiEchantillonMobilier>;
                const mobilierTypeDatation = usMobilier?.item?.mobilier_datation_uuid;
                const type: ApiSyncableType = this.w.data().types.list.find(type => type.type_uuid === mobilierTypeDatation);
                return !!(type?.type_label?.includes(filter));
              default:
                return true;
            }
          } else {
            return true;
          }
        }
      }).length === this.content.headers.length;
    });
    console.timeEnd('onFilter');
    LOG.debug.log({...CONTEXT, action: 'onFilter'}, this.filtered_items);

    this.w.data().context.scope.documents = [];
    if (this.filtered_items.some(item => [ApiDbTable.document, ApiDbTable.document_minute, ApiDbTable.document_photo].includes(item.info.obj_table))) {
      this.filtered_items.forEach(item => {
        if ([ApiDbTable.document, ApiDbTable.document_minute, ApiDbTable.document_photo].includes(item.info.obj_table)){
          LOG.debug.log({...CONTEXT, action: 'onFilter', message: 'adding document to scope'}, item);
          this.w.data().context.scope.documents.push(item.uuid);
        }
      })
    }
    LOG.debug.log({...CONTEXT, action: 'onFilter', message: 'calculated new document SCOPE'}, this.w.data().context.scope.documents);


  }

  protected readonly isDevMode = isDevMode;
  protected readonly DEV = DEV;
  trackByFn: TrackByFunction<dbBoundObject<ApiSyncableObject>> = function userTrackBy(index, obj) {
    return obj.item.created;
  };

  deleteOrRestore(obj: dbBoundObject<ApiSyncableObject>) {

    const item: ApiSyncableObject = obj.item;
    const tag = item['tag'];
    if (item.draft) {
      LOG.debug.log({...CONTEXT, action: 'deleteOrRestore', message: 'discarding draft'}, item);
      obj.discard_draft().pipe(tap((value) => {
        if (value) {
          this.toast.info('Supprimer', tag + ' a été supprimé avec succès');
        } else {
          this.toast.warn('Echec', tag + ' n\'a pas pu être supprimer');
        }
      }));
    } else {
      LOG.debug.log({...CONTEXT, action: 'deleteOrRestore', message: item.live ? 'deleting item' : 'restoring item'}, item);
      obj.commit({
        ...item,
        live: !item.live
      }).pipe(
        tap(() => {
          if (item.live) {
            this.toast.info('Supprimer', tag + ' a été supprimé avec succès');
          } else {
            this.toast.info('Restorer', tag + ' a été restoré avec succès');
          }
        })
      ).subscribe();
    }

  }

  restFilters() {
    if (!this.content?.headers) {
      return;
    }
    this.content.headers = this.content.headers.map(head => {
      head.filter = '';
      return head;
    });
    this.syncFilteredItems();
  }

}

export interface genericContentDescription {
  headers: Array<genericContentHeaderDescription>;
  content: Array<dbBoundObject<ApiSyncableObject>>;
}

export interface genericContentHeaderDescription {
  label: string;
  key: string; // if LINK_LIST then key === ApiDbTable_link
  format?: 'string' | 'number' | 'tag' | 'user' | 'type' | 'info' | 'US' | 'SECTOR' | 'SECTION' | 'usFait' | 'boolean' | 'LINK_LIST' | 'image';
  // Used for display special data => 'usDatation' && 'faitDatation' : Datation mobilier / 'contenu' : Contenant contenu / 'synthese' : Sector syntheses
  specialDisplay?: 'synthese' | 'author' | 'contenu' | 'usDatation' | 'faitDatation';
  color?: (object: ApiSyncableObject) => string;
  filter?: string;
}
