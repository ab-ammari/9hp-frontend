import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {ApiDbTable, ApiFait, ApiStratigraphie, ApiTypeCategory, ApiUs} from "../../../../../shared";
import {IonModal, ModalController} from "@ionic/angular";
import {WorkerService} from "../../../services/worker.service";
import {UI} from "../../../util/ui";
import {LOG, LoggerContext} from "ngx-wcore";
import {Subject} from "rxjs";
import {takeUntil, tap} from "rxjs/operators";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {CastorUtilitiesService} from "../../../services/castor-utilities.service";
import {
  StratigraphieListDisplayComponent
} from "../../Display/stratigraphie-list-display/stratigraphie-list-display.component";
import {
  CastorStratigraphieVisualizationComponent
} from "../../Display/castor-stratigraphie-visualization/castor-stratigraphie-visualization.component";
import {CastorValidationService} from "../../../services/castor-validation.service";
import {ConfirmationService} from "../../../services/confirmation.service";

const CONTEXT: LoggerContext = {
  origin: 'StratigraphieFormComponent'
}


@Component({
  selector: 'app-stratigraphie-form',
  templateUrl: './stratigraphie-form.component.html',
  styleUrls: ['./stratigraphie-form.component.scss']
})
export class StratigraphieFormComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild('addUsLayerModal') layerModal: IonModal;




  @ViewChild('PosterieurList') PosterieurList: StratigraphieListDisplayComponent;
  @ViewChild('ContemporainList') ContemporainList: StratigraphieListDisplayComponent;
  @ViewChild('AnterieurList') AnterieurList: StratigraphieListDisplayComponent;

  @Input() us: ApiUs;
  @Input() fait: ApiFait;

  unSavedForm: boolean;


  @Input() formValid: boolean = false;
  @Output() formValidChange = new EventEmitter();

  usSelectorEnabled: boolean = true;
  faitSelectorEnabled: boolean = true;

  ApiTypeCategory = ApiTypeCategory;

  layerType: 'anterieur' | 'contemporain' | 'posterieur' = 'anterieur';

  /* Stratigraphie variable */
  arrayUsAnterieur: Array<ApiStratigraphie>;
  arrayUscontemporain: Array<ApiStratigraphie>;
  arrayUsposterieur: Array<ApiStratigraphie>;

  typeStratiUuid: string | null = null;

  selectedUs: dbBoundObject<ApiUs> | null = null;
  selectedFait: dbBoundObject<ApiFait> | null = null;

  remarques: string | null = null;

  $subscriber: Subject<unknown> = new Subject<unknown>();
  us_selection_list: Array<dbBoundObject<ApiUs>> = [];
  fait_selection_list: Array<dbBoundObject<ApiFait>> = [];

  isPanelOpen = false;
  currentDepth = 2;

  currentLayoutMode: 'default' | 'elk' | 'dagre-d3' = 'elk';

  constructor(
    public w: WorkerService,
    private utiles: CastorUtilitiesService
      , private modalCtrl: ModalController,
    private validation: CastorValidationService,
    private confirmation: ConfirmationService
  ) {
  }

  ngOnInit(): void {
    LOG.debug.log({...CONTEXT, action: 'ngOnInit'});
    this.w.data().objects.stratigraphie.all.onValueChange().pipe(
      takeUntil(this.$subscriber),
      tap(() => this.getStratiRelations())
    ).subscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    LOG.debug.log({...CONTEXT, action: 'ngOnChanges'});

    this.getStratiRelations();
  }

  ngOnDestroy() {
    this.$subscriber.next(true);
    this.$subscriber.complete();
  }
  async openVisualization() {

    const modal = await this.modalCtrl.create({
      component: CastorStratigraphieVisualizationComponent,
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();
  }
  forceRefreshUI(){
    this.getStratiRelations();
    void this.AnterieurList?.validateList();
    void this.PosterieurList?.validateList();
    void this.ContemporainList?.validateList();
  }

  getStratiRelations() {
    const us_uuid = this.us?.us_uuid;
    const fait_uuid = this.fait?.fait_uuid;

    LOG.debug.log({...CONTEXT, action: 'getStratiRelations'}, 'us_uuid', us_uuid, 'fait_uuid', fait_uuid);

    const usStatigraphie: {
      anterieur: Array<ApiStratigraphie>;
      contemporain: Array<ApiStratigraphie>;
      posterieur: Array<ApiStratigraphie>;
    } = this.utiles.getStratigraphie(us_uuid ?? fait_uuid);

    this.arrayUsposterieur = usStatigraphie.posterieur;
    this.arrayUscontemporain = usStatigraphie.contemporain;
    this.arrayUsAnterieur = usStatigraphie.anterieur;

    LOG.debug.log({...CONTEXT, action: 'getStratiRelations'},
      'anterieur', this.arrayUsAnterieur?.length,
      'contemporain', this.arrayUscontemporain?.length,
      'posterieur', this.arrayUsposterieur?.length);

    if (this.arrayUsAnterieur?.length > 0 && this.arrayUsposterieur?.length > 0) {
      this.formValid = true;
      this.formValidChange.emit(this.formValid);
    }
    this.updateSelectionList({});
  }

  openLayerModal(layer: 'anterieur' | 'contemporain' | 'posterieur') {
    this.layerType = layer;
    this.layerModal?.present();
  }

  validLayer() {

    // TODO: Check if having a strat relation, then display popup
    // .some(strat => [strat.item.us_posterieur, strat.item.us_anterieur].includes(us.item.us_uuid));
    const newStratigraphie: ApiStratigraphie = {
      author_uuid: this.w.data().user.user_uuid,
      us_anterieur: ['anterieur', 'contemporain'].includes(this.layerType) ? this.selectedUs?.uuid : this.us?.us_uuid,
      us_posterieur: ['anterieur', 'contemporain'].includes(this.layerType) ? this.us?.us_uuid : this.selectedUs?.uuid,
      fait_posterieur: ['anterieur', 'contemporain'].includes(this.layerType) ? this.fait?.fait_uuid : this.selectedFait?.uuid,
      fait_anterieur: ['anterieur', 'contemporain'].includes(this.layerType) ? this.selectedFait?.uuid : this.fait?.fait_uuid,
      is_contemporain: this.layerType === 'contemporain',
      live: true,
      strati_type_uuid: this.typeStratiUuid,
      stratigraphie_uuid: null,
      table: ApiDbTable.stratigraphie,
      versions: [],
      projet_uuid: UI.state.store.projet_uuid
    };

    // collect all existing active stratigraphic relations
    const existingRelations = this.w.data().objects.stratigraphie.all.list
      .filter(obj => obj.item.live) // Seulement les relations actives
      .map(obj => obj.item);

    // validate a new stratigraphic relation
    const validationResult = this.validation.validateNewStratigraphie(newStratigraphie, existingRelations);

    if (!validationResult.result) {
      this.confirmation.showConfirmDialog(
        'Attention : Contradiction stratigraphique',
        validationResult.message || 'Cette relation stratigraphique est invalide. Voulez-vous vraiment l\'ajouter ?',
        () => {
          // if user confirm, add the relation anyway
          this.saveStratigraphie(newStratigraphie);
        },
        () => {
          // if user cancel, do nothing
          return;
        },
        'Conserver la relation',
        'Annuler la relation'
      );
    } else {
      // if no contradiction, add the relation
      this.saveStratigraphie(newStratigraphie);
    }
  }

  // method to save the stratigraphic relationship
  private saveStratigraphie(strati: ApiStratigraphie) {
    LOG.debug.log('Add new strati relation ', strati);
    this.w.data().objects.stratigraphie.selected.commit(strati).subscribe(() => {
      this.closeModal();
    });
  }

  onChangeForm() {
    if (this.unSavedForm) {
      return;
    } else {
      this.unSavedForm = true;

    }
  }

  onWillDismiss(e: Event) {
    this.clearValue();
  }

  closeModal() {
    this.layerModal?.dismiss();
  }

  clearValue() {
    // this.selectedRelation = null;
    this.selectedUs = null;
    this.selectedFait = null;
    this.typeStratiUuid = null;
  }

  public updateSelectionList({us_uuid, fait_uuid}: {us_uuid?: string, fait_uuid?: string}) {

    if(  this.faitSelectorEnabled && this.usSelectorEnabled) {
      if (us_uuid && this.selectedFait) {
        if (this.selectedFait.uuid !== this.w.data().objects.us.all.findByUuid(us_uuid)?.item?.fait_uuid) {
          this.selectedFait = null;
        }
        this.selectedUs = this.w.data().objects.us.all.findByUuid(us_uuid);
      }
      if (fait_uuid && this.selectedFait) {
        this.selectedFait = this.w.data().objects.fait.all.findByUuid(fait_uuid);
        if(this.selectedUs.item.fait_uuid !== fait_uuid) {
          this.selectedUs = null;
        }
      }
    }


    this.fait_selection_list = this.w.data().objects.fait.all.list?.filter(fait => {
      const uuid = this.fait?.fait_uuid;
      if (uuid && uuid === fait.item.fait_uuid) {
        return false;
      }
      return this.w.data().objects.stratigraphie.all.list?.filter(strat => strat.item.live);
    });
    this.us_selection_list = this.w.data().objects.us.all.list?.filter(us => {
      const uuid = this.us?.us_uuid;
      if (uuid && uuid === us.item.us_uuid) {
        return false;
      } else if (this.faitSelectorEnabled && this.selectedFait && this.selectedFait.uuid === us.item.fait_uuid) {
    //    console.log("1-TRUE - US", uuid, us.item.us_uuid);
        //    console.log("1-TRUE - FAIT", this.selectedFait, us.item.fait_uuid);
        return true;
      } else if (!this.faitSelectorEnabled || !this.selectedFait){
     //   console.log("2-TRUE - US", uuid, us.item.us_uuid);
     //   console.log("2-TRUE - FAIT", this.selectedFait, us.item.fait_uuid);
        return true;
      } else {
        return false;
      }

    });
  }

  openFocusedDiagram(): void {
    console.log('=== openFocusedDiagram ===');
    console.log('us:', this.us);
    console.log('fait:', this.fait);
    console.log('currentEntityUuid:', this.currentEntityUuid);
    console.log('currentEntityType:', this.currentEntityType);
    this.isPanelOpen = true;
    console.log('isPanelOpen:', this.isPanelOpen);
  }

  closeFocusedPanel(): void {
    this.isPanelOpen = false;
    // Reset pour pouvoir regénérer la prochaine fois
    // si on veut garder le diagramme en cache
  }

  get currentEntityUuid(): string | null {
    const uuid = this.us?.us_uuid || this.fait?.fait_uuid || null;
    console.log('currentEntityUuid getter:', uuid);
    return uuid;
  }

  get currentEntityType(): 'us' | 'fait' | null {
    const type = this.us?.us_uuid ? 'us' : (this.fait?.fait_uuid ? 'fait' : null);
    console.log('currentEntityType getter:', type);
    return type;
  }

}
