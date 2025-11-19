import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {
  ApiDbTable,
  ApiFait,
  ApiSecteur,
  ApiSyncableObject,
  ApiTypeCategory,
  ApiUs,
  TagSystem
} from "../../../../../shared";
import {UsTypeEnum} from "../../../../../shared/objects/models/enums/UsTypeEnum";
import {LOG, LoggerContext} from "ngx-wcore";
import {tap} from "rxjs/operators";
import {WorkerService} from "../../../services/worker.service";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";

const CONTEXT: LoggerContext = {
  origin: 'NewUsComponent'
}
@Component({
  selector: 'app-new-us-form',
  templateUrl: './new-us-form.component.html',
  styleUrls: ['./new-us-form.component.scss']
})
export class NewUsFormComponent implements OnInit, OnChanges {

  protected readonly ApiTypeCategory = ApiTypeCategory;

  @Output() onUsCreated = new EventEmitter();
  @Output() onCancelBtnClicked = new EventEmitter();
  @Input() sectorUuid: string;
  @Input() faitUuid: string;

  usTypeSelected: UsTypeEnum;
  numberOfCreation: number;
  selected_fait: dbBoundObject<ApiSyncableObject>;
  selected_sector: dbBoundObject<ApiSyncableObject>;
  selected_us_identification_uuid: string;
  creating: boolean = false;
  error: string = '';

  FaitFilter = (obj: ApiFait) => {
    if (obj.secteur_uuid && this.selected_sector && obj.secteur_uuid !== (this.selected_sector?.item as ApiSecteur).secteur_uuid) {
      return false;
    } else {
      return true;
    }
  };
  SectorFilter = (obj: ApiSecteur) => {
    if (obj.secteur_uuid && this.selected_fait && obj.secteur_uuid !== (this.selected_fait.item as ApiFait).secteur_uuid) {
      return false;
    } else {
      return true;
    }
  };

  get isTagSystemFait(): boolean {
    return this.w.data().isTagSystem(ApiDbTable.us, TagSystem.FAIT);
  }

  constructor(public w: WorkerService) { }

  ngOnInit(): void {
    if (this.sectorUuid) {
      this.selected_sector = this.w.data().objects.secteur.all.findByUuid(this.sectorUuid);
    }
    if (this.faitUuid) {
      this.selected_fait = this.w.data().objects.fait.all.findByUuid(this.faitUuid);
    }
  }
  ngOnChanges(changes: SimpleChanges) {

  }


  createNewUs() {
    this.error = '';
    if (this.w.data()?.user?.user_uuid ) {

      let usTable: ApiDbTable;
      switch (this.usTypeSelected) {
        case UsTypeEnum.NEGATIVE:
          usTable = ApiDbTable.us_negative;
          break;
        case UsTypeEnum.POSITIVE:
          usTable = ApiDbTable.us_positive;
          break;
        case UsTypeEnum.CONSTRUITE:
          usTable = ApiDbTable.us_construite;
          break;
        case UsTypeEnum.TECHNIQUE:
          usTable = ApiDbTable.us_technique;
          break;
        default:
          usTable = ApiDbTable.us
          break;
      }

      const newUs: ApiUs = {
        created: null,
        live: true,
        secteur_uuid: (this.selected_sector?.item as ApiSecteur).secteur_uuid ?? null,
        projet_uuid: this.w.data().projet.selected.item.projet_uuid,
        us_dim_reel_longeur: true,
        us_dim_reel_largeur: true,
        us_dim_reel_hauteur: true,
        table: usTable,
        us_identification_uuid: this.selected_us_identification_uuid,
        tag: null,
        tag_hash: null,
        us_stat: 'cde82d36-4c81-46e6-9613-1435556a948a',
        us_uuid: null,
        author_uuid: this.w.data()?.user?.user_uuid,
        versions: [],
        fait_uuid: (this.selected_fait?.item as ApiFait)?.fait_uuid ?? null
      }
      LOG.debug.log({...CONTEXT, action: 'createNewUs'}, newUs);

        this.w.data().objects.us.selected.commit(newUs).pipe(tap((value) => {
        const newUs: ApiUs = value[0] as ApiUs;
        this.onUsCreated.emit(newUs.us_uuid);
      })).subscribe({
          error: err => {
            this.error = err;
          }
        });
    } else {
      this.error = 'no user selected';
    }
  }

  isValidUsCreation(): boolean {
    return !!(this.selected_sector && this.usTypeSelected);
  }

}
