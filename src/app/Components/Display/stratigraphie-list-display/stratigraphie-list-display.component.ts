import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiDbTable, ApiFait, ApiStratigraphie, ApiSyncableType, ApiTypeCategory, ApiUs} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {StratigraphieTypeCategoryUuids} from "../../../../../shared/objects/models/StandardTypes";
import {ConfirmationService} from "../../../services/confirmation.service";
import {CastorValidationService} from "../../../services/castor-validation.service";
import {LOG, LoggerContext} from "ngx-wcore";
import {CastorAuthorizationService} from "../../../services/castor-authorization-service.service";

interface uiConfig {
  backgroundColor?: string;
  warningLabel?: string;
  paradoxWarningLabel?: string;
  paradoxType?: string;
}

const LIST_CONTEXT: LoggerContext = {
  origin: 'StratigraphieListDisplayComponent'
};

@Component({
  selector: 'app-stratigraphie-list-display',
  templateUrl: './stratigraphie-list-display.component.html',
  styleUrls: ['./stratigraphie-list-display.component.scss']
})
export class StratigraphieListDisplayComponent implements OnInit, OnChanges {


  @Input() stratiRelationType: 'anterieur' | 'contemporain' | 'posterieur';
  @Input() us_ref: ApiUs;
  @Input() fait_ref: ApiFait;

  @Input() set relationStratiListInput(value: Array<ApiStratigraphie & uiConfig>) {
    LOG.debug.log({...LIST_CONTEXT, action: 'relationStratiListInput'}, 'Received list', value?.length);

    // On clone la liste pour éviter de modifier les objets reçus en entrée, tout en appliquant le libellé circonstanciel.
    const preparedList = (value ?? []).map(item => {
      const clone = {...item};
      clone.strati_type_uuid = this.getCircumstancialTypeUuid(clone);
      // Réinitialiser les marquages pour une liste fraîche
      clone.backgroundColor = null;
      clone.warningLabel = null;
      clone.paradoxWarningLabel = null;
      clone.paradoxType = null;
      return clone;
    });

    // TOUJOURS afficher la liste immédiatement
    this.relationStratiList = preparedList;
    LOG.debug.log({...LIST_CONTEXT, action: 'relationStratiListInput'}, 'List set', this.relationStratiList?.length);

    // Validation automatique seulement si activée ET mode auto
    const validationEnabled = localStorage.getItem('enableStratiValidation') !== 'false';
    const autoValidation = localStorage.getItem('autoStratiValidation') === 'true';

    if (validationEnabled && autoValidation) {
      void this.validateList();
    }
  }

  relationStratiList: Array<ApiStratigraphie & uiConfig>;
  validationProgress: { current: number, total: number } | null = null;
  isValidating = false;

  ApiDbTable = ApiDbTable;

  get showValidationControls(): boolean {
    const validationEnabled = localStorage.getItem('enableStratiValidation') !== 'false';
    const autoValidation = localStorage.getItem('autoStratiValidation') === 'true';
    return validationEnabled && !autoValidation;
  }

  constructor(
    private w: WorkerService,
    private confirmationService: ConfirmationService,
    private validation: CastorValidationService,
    private authService: CastorAuthorizationService
    ) {
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
  }

  async validateList(): Promise<void> {
    const validationEnabled = localStorage.getItem('enableStratiValidation') !== 'false';

    if (!validationEnabled) {
      LOG.info.log({...LIST_CONTEXT, action: 'validateList', message: 'Validation désactivée'});
      return;
    }

    if (this.validation.isBatchValidationRunning()) {
      LOG.warn.log({...LIST_CONTEXT, action: 'validateList', message: 'Validation déjà en cours'});
      return;
    }

    this.isValidating = true;
    const totalRelations = this.relationStratiList?.length ?? 0;
    this.validationProgress = { current: 0, total: totalRelations };

    LOG.info.log({...LIST_CONTEXT, action: 'validateList'},
      'Validating', totalRelations, 'relations',
      this.relationStratiList?.map(r => r.stratigraphie_uuid?.substring(0, 8)));

    try {
      const allRelations = (this.w.data().objects.stratigraphie.all.list ?? [])
        .filter(obj => obj?.item)
        .map(obj => obj.item);

      this.relationStratiList = (this.relationStratiList ?? []).map((item, index) => {
        // Mise à jour de la progression
        this.validationProgress = { current: index + 1, total: totalRelations };

        const existingRelations = allRelations
          .filter(rel => rel.live && rel.stratigraphie_uuid !== item.stratigraphie_uuid);

        // VALIDATION UNIQUE
        const paradoxResult = this.validation.validateNewStratigraphie(item, existingRelations);

        const hasParadox = !paradoxResult.result;

        if (hasParadox) {
          const warningLabel = paradoxResult.message ?? 'Unknown paradox detected';
          const paradoxWarning = paradoxResult.shortMessage ?? warningLabel;

          return {
            ...item,
            backgroundColor: 'yellow',
            warningLabel: warningLabel,
            paradoxWarningLabel: paradoxWarning,
            paradoxType: paradoxResult.paradoxType ?? null
          };
        } else {
          // Pas de paradoxe
          return {
            ...item,
            backgroundColor: null,
            warningLabel: null,
            paradoxWarningLabel: null,
            paradoxType: null
          };
        }
      });

      LOG.info.log({...LIST_CONTEXT, action: 'validateList', message: 'Validation terminée'},
        totalRelations, 'relations validées');

    } catch (error) {
      LOG.error.log({...LIST_CONTEXT, action: 'validateList'}, error);
    } finally {
      this.isValidating = false;
      this.validationProgress = null;
    }
  }

  /*async validateList(): Promise<void> {
    const validationEnabled = localStorage.getItem('enableStratiValidation') !== 'false';

    if (!validationEnabled) {
      LOG.info.log({...LIST_CONTEXT, action: 'validateList', message: 'Validation désactivée'});
      return;
    }

    if (this.validation.isBatchValidationRunning()) {
      LOG.warn.log({...LIST_CONTEXT, action: 'validateList', message: 'Validation déjà en cours'});
      return;
    }

    this.isValidating = true;
    this.validationProgress = { current: 0, total: this.relationStratiList?.length ?? 0 };

    LOG.info.log({...LIST_CONTEXT, action: 'validateList'},
      'Validating', this.relationStratiList?.length, 'relations',
      this.relationStratiList?.map(r => r.stratigraphie_uuid?.substring(0, 8)));

    try {
      const allRelations = (this.w.data().objects.stratigraphie.all.list ?? [])
        .filter(obj => obj?.item)
        .map(obj => obj.item);

      const results = await this.validation.validateBatch(
        this.relationStratiList ?? [],
        (current, total) => {
          this.validationProgress = { current, total };
        }
      );

      this.relationStratiList = (this.relationStratiList ?? []).map(item => {
        const result = results.get(item.stratigraphie_uuid);
        const hasParadox = result ? !result.result : false;
        const warningLabel = hasParadox ? (result.message ?? 'Unknown paradox detected') : null;

        const baseItem: ApiStratigraphie & uiConfig = {
          ...item,
          backgroundColor: hasParadox ? 'yellow' : null,
          warningLabel,
          paradoxWarningLabel: hasParadox ? (result?.shortMessage ?? warningLabel) : null,
          paradoxType: hasParadox ? result?.paradoxType ?? null : null
        };

        const existingRelations = allRelations
          .filter(rel => rel.live && rel.stratigraphie_uuid !== item.stratigraphie_uuid);

        const paradoxResult = this.validation.validateNewStratigraphie(item, existingRelations);
        if (!paradoxResult.result) {
          const paradoxWarning = paradoxResult.shortMessage ?? paradoxResult.message ?? 'Paradox detected in relation';
          return {
            ...baseItem,
            backgroundColor: 'yellow',
            warningLabel: baseItem.warningLabel ?? paradoxResult.message ?? paradoxWarning,
            paradoxWarningLabel: paradoxWarning,
            paradoxType: paradoxResult.paradoxType ?? baseItem.paradoxType ?? null
          };
        }

        return {
          ...baseItem,
          paradoxWarningLabel: hasParadox ? baseItem.paradoxWarningLabel : null,
          paradoxType: hasParadox ? baseItem.paradoxType : null
        };
      });

      LOG.info.log({...LIST_CONTEXT, action: 'validateList', message: 'Validation terminée'}, results.size);
    } catch (error) {
      LOG.error.log({...LIST_CONTEXT, action: 'validateList'}, error);
    } finally {
      this.isValidating = false;
      this.validationProgress = null;
    }
  }*/

  cancelValidation(): void {
    this.validation.cancelBatchValidation();
    this.isValidating = false;
    this.validationProgress = null;
  }

  clearValidation(): void {
    this.relationStratiList = (this.relationStratiList ?? []).map(item => ({
      ...item,
      backgroundColor: null,
      warningLabel: null,
      paradoxWarningLabel: null,
      paradoxType: null
    }));
  }

  canDeleteRelation(strati: ApiStratigraphie): boolean {
    return this.authService.canDeleteRelation(strati);
  }

  deleteRelation(strati: ApiStratigraphie) {
    if (this.authService.canDeleteRelation(strati)) {
      this.confirmationService.showConfirmDialog('Attention !',
        'Voulez-vous supprimer cette relation ?',
        () => {
          strati.live = false;
          this.w.data().objects.stratigraphie.selected.commit(strati).subscribe();
        }, () => { return; });
    } else {
      this.confirmationService.showInfoDialog(
        'Accès refusé',
        'Seul le propriétaire du projet ou le créateur de cette relation peut la supprimer.'
      );
    }
  }

  getCircumstancialTypeUuid(stratigraphie: ApiStratigraphie): string {
    if (this.stratiRelationType === 'anterieur') {
      switch (stratigraphie.strati_type_uuid) {
        case StratigraphieTypeCategoryUuids.remplit:
          return StratigraphieTypeCategoryUuids.remplie_par;
        case StratigraphieTypeCategoryUuids.coupe:
          return StratigraphieTypeCategoryUuids.coupee_par;
        case StratigraphieTypeCategoryUuids.bouche:
          return StratigraphieTypeCategoryUuids.bouchee_par;
        case StratigraphieTypeCategoryUuids.appuie_contre:
          return StratigraphieTypeCategoryUuids.sert_d_appuie_a;
        case StratigraphieTypeCategoryUuids.sur:
          return StratigraphieTypeCategoryUuids.sous;
        default:
          return stratigraphie.strati_type_uuid;
      }
    } else if (this.stratiRelationType === 'posterieur') {
      switch (stratigraphie.strati_type_uuid) {
        case StratigraphieTypeCategoryUuids.sous:
          return StratigraphieTypeCategoryUuids.sur;
        case StratigraphieTypeCategoryUuids.sert_d_appuie_a:
          return StratigraphieTypeCategoryUuids.appuie_contre;
        case StratigraphieTypeCategoryUuids.coupee_par:
          return StratigraphieTypeCategoryUuids.coupe;
        case StratigraphieTypeCategoryUuids.remplie_par:
          return StratigraphieTypeCategoryUuids.remplit;
        case StratigraphieTypeCategoryUuids.bouchee_par:
          return StratigraphieTypeCategoryUuids.bouche;
        default:
          return stratigraphie.strati_type_uuid;
      }
    } else {
      return stratigraphie.strati_type_uuid;
    }
  }

}
