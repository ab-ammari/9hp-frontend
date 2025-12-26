import { Component, OnInit, OnDestroy } from '@angular/core';
import { WorkerService } from '../../services/worker.service';
import {CastorValidationService, CycleParadox, DetectedParadox} from '../../services/castor-validation.service';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { LOG, LoggerContext } from 'ngx-wcore';
import {ApiDbTable, ApiStratigraphie} from "../../../../shared";
import {ConfirmationService} from "../../services/confirmation.service";
import {CastorAuthorizationService} from "../../services/castor-authorization-service.service";

const CONTEXT: LoggerContext = {
  origin: 'StratigraphicTestComponent'
}

@Component({
  selector: 'app-stratigraphic-test',
  templateUrl: './stratigraphic-test.component.html',
  styleUrls: ['./stratigraphic-test.component.scss']
})
export class StratigraphicTestComponent implements OnInit, OnDestroy {
  private destroyer$ = new Subject<void>();
  isExpanded: boolean[] = [];

  groupedParadoxes: Map<string, DetectedParadox[]> = new Map();
  expandedGroups: {[key: string]: boolean} = {};
  expandedCycles: Record<string, boolean> = {};

  isDeletingRelation = false;

  paradoxResults: (DetectedParadox & { isExpanded?: boolean })[] = [];

  // Types de paradoxes disponibles
  paradoxTypes = [
    { 
      id: null, 
      name: 'Tous',
      description: 'Recherche tous les types de paradoxes stratigraphiques dans le projet.'
    },
    { 
      id: 'cycle', 
      name: 'Cycles',
      description: 'Détecte les boucles impossibles où une entité serait à la fois antérieure et postérieure à elle-même (ex: US1 → US2 → US3 → US1).'
    },
    { 
      id: 'consistency', 
      name: 'Cohérence entre Faits',
      description: 'Vérifie que les relations entre US de Faits différents sont cohérentes. Toutes les US d\'un même Fait doivent maintenir des relations compatibles avec les entités externes.'
    },
    { 
      id: 'containment', 
      name: 'Contenance US/Fait',
      description: 'Vérifie qu\'aucune relation stratigraphique directe n\'existe entre un Fait et ses propres US (une US ne peut pas être antérieure/postérieure à son propre Fait).'
    },
    { 
      id: 'temporal', 
      name: 'Temporel',
      description: 'Détecte les contradictions directes : une relation antérieur/postérieur qui contredit une relation existante ou une relation contemporaine incompatible.'
    }
  ];

  // Sélection actuelle
  selectedParadoxType: 'containment' | 'consistency' | 'temporal' | 'cycle' | null = null;

  // État de la recherche
  isSearching: boolean = false;
  hasSearched: boolean = false;

  // Panneau de filtrage
  isFilterPanelOpen: boolean = false;

  protected readonly ApiDbTable = ApiDbTable;

  simulationResults: {
    originalParadoxes: (DetectedParadox & { isExpanded?: boolean })[];
    simulatedParadoxes: (DetectedParadox & { isExpanded?: boolean })[];
    removedRelation: ApiStratigraphie;
    addedCycles: number;
    removedCycles: number;
    addedParadoxes: number;
    removedParadoxes: number;
    isActive: boolean;
  } = {
    originalParadoxes: [],
    simulatedParadoxes: [],
    removedRelation: null,
    addedCycles: 0,
    removedCycles: 0,
    addedParadoxes: 0,
    removedParadoxes: 0,
    isActive: false
  };

  private readonly paradoxDisplayOrder = ['cycle', 'consistency', 'containment', 'temporal'];

  constructor(
    public w: WorkerService,
    private validationService: CastorValidationService,
    private confirmationService: ConfirmationService,
    private authService: CastorAuthorizationService
  ) { }

  ngOnInit(): void {
    LOG.debug.log({...CONTEXT, action: 'ngOnInit'}, 'Initializing stratigraphic test component');

    this.w.data().objects.onObjectsChange.pipe(
      takeUntil(this.destroyer$),
      tap(() => {
        LOG.debug.log({...CONTEXT, action: 'onObjectsChange'}, 'Objects changed');
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroyer$.next();
    this.destroyer$.complete();
  }

  // ==========================================
  // MÉTHODES DU PANNEAU DE FILTRAGE
  // ==========================================

  /**
   * Ouvre le panneau de filtrage
   */
  openFilterPanel(): void {
    this.isFilterPanelOpen = true;
  }

  /**
   * Callback quand le panneau de filtrage est fermé
   */
  onFilterPanelClosed(): void {
    this.isFilterPanelOpen = false;
  }

  /**
   * Sélectionne un type de paradoxe dans le panneau
   */
  selectParadoxType(typeId: string | null): void {
    this.selectedParadoxType = typeId as any;
  }

  /**
   * Applique le filtre et relance la recherche
   */
  applyFilterAndClose(): void {
    this.isFilterPanelOpen = false;
    this.findParadoxes();
  }

  /**
   * Retourne l'icône correspondant au type de paradoxe
   */
  getParadoxTypeIcon(typeId: string | null): string {
    switch (typeId) {
      case null:
        return 'list-outline';
      case 'cycle':
        return 'sync-outline';
      case 'consistency':
        return 'git-compare-outline';
      case 'containment':
        return 'cube-outline';
      case 'temporal':
        return 'time-outline';
      default:
        return 'help-outline';
    }
  }

  /**
   * Retourne le libellé court du type de paradoxe
   */
  getParadoxTypeLabel(typeId: string | null): string {
    const type = this.paradoxTypes.find(t => t.id === typeId);
    return type ? type.name : 'Tous';
  }

  /**
   * Retourne la couleur du badge selon le type de paradoxe
   */
  getParadoxBadgeColor(type: string): string {
    switch (type) {
      case 'cycle':
        return 'danger';
      case 'consistency':
        return 'warning';
      case 'containment':
        return 'tertiary';
      case 'temporal':
        return 'secondary';
      default:
        return 'medium';
    }
  }

  // ==========================================
  // MÉTHODES DE RECHERCHE
  // ==========================================

  /**
   * Lance la recherche de paradoxes stratigraphiques
   */
  findParadoxes(): void {
    LOG.debug.log({...CONTEXT, action: 'findParadoxes'}, `Searching for paradoxes of type: ${this.selectedParadoxType || 'all'}`);

    this.isSearching = true;
    this.paradoxResults = [];
    this.expandedCycles = {};

    setTimeout(() => {
      try {
        this.paradoxResults = this.validationService.findAllParadoxes(this.selectedParadoxType);
        LOG.debug.log({...CONTEXT, action: 'findParadoxes'}, `Found ${this.paradoxResults.length} paradoxes`);

        this.groupParadoxesByType();
        this.initializeExpandedStates();
        this.hasSearched = true;

      } catch (error) {
        LOG.error.log({...CONTEXT, action: 'findParadoxes'}, 'Error searching for paradoxes:', error);
      } finally {
        this.isSearching = false;
      }
    }, 100);
  }

  private buildCycleKey(groupKey: string, index: number): string {
    return `${groupKey}:${index}`;
  }

  initializeExpandedStates(): void {
    this.expandedCycles = {};
    this.groupedParadoxes.forEach((paradoxes, type) => {
      paradoxes.forEach((_, index) => {
        const key = this.buildCycleKey(type, index);
        this.expandedCycles[key] = false;
      });
    });
  }

  getUsTag(usUuid: string): string {
    const us = this.w.data().objects.us.all.findByUuid(usUuid);
    return us ? us.item.tag : usUuid;
  }

  getFaitTag(faitUuid: string): string {
    const fait = this.w.data().objects.fait.all.findByUuid(faitUuid);
    return fait ? fait.item.tag : faitUuid;
  }

  formatParadoxType(type: string): string {
    const paradoxType = this.paradoxTypes.find(pt => pt.id === type);
    return paradoxType ? paradoxType.name : type;
  }

  isCycleParadox(paradox: any): paradox is CycleParadox {
    return paradox.type === 'cycle' && 'cycleNodes' in paradox;
  }

  formatCycle(cycleNodes: string[]): string {
    return cycleNodes.join(' → ') + ' → ' + cycleNodes[0];
  }

  initAccordionStates(): void {
    if (this.paradoxResults) {
      this.isExpanded = new Array(this.paradoxResults.length).fill(false);
    }
  }

  groupParadoxesByType(): void {
    this.groupedParadoxes.clear();
    this.expandedGroups = {};

    this.paradoxTypes.forEach(type => {
      if (type.id) {
        this.groupedParadoxes.set(type.id, []);
        this.expandedGroups[type.id] = false;
      }
    });

    this.paradoxResults.forEach(paradox => {
      const type = paradox.type || 'unknown';
      if (!this.groupedParadoxes.has(type)) {
        this.groupedParadoxes.set(type, []);
      }
      this.groupedParadoxes.get(type).push(paradox);
    });
  }

  toggleGroupExpand(type: string): void {
    this.expandedGroups[type] = !this.expandedGroups[type];
  }

  isCycleExpanded(groupKey: string, index: number): boolean {
    return !!this.expandedCycles[this.buildCycleKey(groupKey, index)];
  }

  toggleCycleExpand(groupKey: string, cycleIndex: number, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const key = this.buildCycleKey(groupKey, cycleIndex);
    this.expandedCycles = {
      ...this.expandedCycles,
      [key]: !this.expandedCycles[key]
    };
  }

  getInvolvedRelationsCount(paradox: any): number {
    if (this.isCycleParadox(paradox)) {
      return paradox.allRelations?.length || 0;
    }
    return paradox.relations?.length || 0;
  }

  formatRelationAsText(relation: ApiStratigraphie): string {
    if (!relation) {
      return 'Relation indéfinie';
    }

    try {
      let entity1 = '';
      let entity2 = '';
      let relationType = '';

      if (relation.us_anterieur) {
        entity1 = `US ${this.getUsTag(relation.us_anterieur)}`;
      } else if (relation.fait_anterieur) {
        entity1 = `Fait ${this.getFaitTag(relation.fait_anterieur)}`;
      } else {
        entity1 = 'Entité inconnue';
      }

      if (relation.us_posterieur) {
        entity2 = `US ${this.getUsTag(relation.us_posterieur)}`;
      } else if (relation.fait_posterieur) {
        entity2 = `Fait ${this.getFaitTag(relation.fait_posterieur)}`;
      } else {
        entity2 = 'Entité inconnue';
      }

      if (relation.is_contemporain) {
        relationType = 'contemporain à';
      } else {
        relationType = 'postérieure à';
      }

      return `${entity1} est ${relationType} ${entity2}`;
    } catch (error) {
      console.error('Erreur lors du formatage de la relation', error);
      return 'Relation non formatée';
    }
  }

  canDeleteRelation(strati: ApiStratigraphie): boolean {
    return this.authService.canDeleteRelation(strati);
  }

  deleteRelation(relation: ApiStratigraphie, event?: Event): void {
    if (this.isDeletingRelation) {
      return;
    }

    if (event) {
      event.stopPropagation();
    }

    if (this.authService.canDeleteRelation(relation)) {
      this.confirmationService.showConfirmDialog(
        'Supprimer la relation',
        `Êtes-vous sûr de vouloir supprimer la relation : "${this.formatRelationAsText(relation)}" ?`,
        () => {
          this.isDeletingRelation = true;
          relation.live = false;
          this.w.data().objects.stratigraphie.selected.commit(relation).subscribe(
            () => {
              console.log('Relation supprimée avec succès');
              setTimeout(() => {
                this.findParadoxes();
                this.isDeletingRelation = false;
              }, 100);
            },
            error => {
              console.error('Erreur lors de la suppression de la relation', error);
              this.isDeletingRelation = false;
              this.confirmationService.showConfirmDialog(
                'Erreur',
                'Une erreur est survenue lors de la suppression de la relation.',
                () => {},
                () => {},
                'OK',
                null
              );
            }
          );
        },
        () => {
          console.log('Suppression annulée');
        }
      );
    } else {
      this.confirmationService.showInfoDialog(
        'Accès refusé',
        'Seul le propriétaire du projet ou le créateur de cette relation peut la supprimer.'
      );
    }
  }

  simulateRelationRemoval(relation: ApiStratigraphie, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.simulationResults.originalParadoxes = [...this.paradoxResults];
    this.simulationResults.removedRelation = relation;

    const currentLiveState = relation.live;
    relation.live = false;

    LOG.debug.log({...CONTEXT, action: 'simulateRelationRemoval'}, `Simulation de la suppression de la relation: ${relation.stratigraphie_uuid}`);

    setTimeout(() => {
      try {
        const simulatedResults = this.validationService.findAllParadoxes() as (DetectedParadox & { isExpanded?: boolean })[];
        this.simulationResults.simulatedParadoxes = simulatedResults;
        this.calculateImpactStatistics();
        this.simulationResults.isActive = true;

        LOG.debug.log(
          {...CONTEXT, action: 'simulateRelationRemoval'},
          `Simulation terminée. Paradoxes avant: ${this.simulationResults.originalParadoxes.length}, après: ${this.simulationResults.simulatedParadoxes.length}`
        );
      } catch (error) {
        console.error('Erreur lors de la simulation', error);
      } finally {
        relation.live = currentLiveState;
      }
    }, 100);
  }

  calculateImpactStatistics(): void {
    const countByType = (paradoxes: DetectedParadox[], type: string): number =>
      paradoxes.filter(p => p.type === type).length;

    const originalCycleCount = countByType(this.simulationResults.originalParadoxes, 'cycle');
    const simulatedCycleCount = countByType(this.simulationResults.simulatedParadoxes, 'cycle');

    const originalParadoxCount = this.simulationResults.originalParadoxes.length;
    const simulatedParadoxCount = this.simulationResults.simulatedParadoxes.length;

    this.simulationResults.removedCycles = Math.max(0, originalCycleCount - simulatedCycleCount);
    this.simulationResults.addedCycles = Math.max(0, simulatedCycleCount - originalCycleCount);

    this.simulationResults.removedParadoxes = Math.max(0, originalParadoxCount - simulatedParadoxCount);
    this.simulationResults.addedParadoxes = Math.max(0, simulatedParadoxCount - originalParadoxCount);

    LOG.debug.log({...CONTEXT, action: 'calculateImpactStatistics'}, {
      originalCycleCount,
      simulatedCycleCount,
      originalParadoxCount,
      simulatedParadoxCount,
      impact: {
        removedCycles: this.simulationResults.removedCycles,
        addedCycles: this.simulationResults.addedCycles,
        removedParadoxes: this.simulationResults.removedParadoxes,
        addedParadoxes: this.simulationResults.addedParadoxes
      }
    });
  }

  closeImpactPreview(): void {
    this.simulationResults.isActive = false;
  }

  confirmRemovalAfterImpactPreview(): void {
    if (this.simulationResults.removedRelation) {
      this.deleteRelation(this.simulationResults.removedRelation);
      this.closeImpactPreview();
    }
  }

  getShortMessage(paradox: DetectedParadox): string {
    if (paradox.shortMessage) {
      return paradox.shortMessage;
    }

    const firstSentence = paradox.message.split('.')[0];

    if (firstSentence.length > 150) {
      return firstSentence.substring(0, 147) + '...';
    }

    return firstSentence;
  }

  getEntityTable(uuid: string): ApiDbTable | null {
    if (!uuid) {
      return null;
    }

    const us = this.w.data().objects.us.all.findByUuid(uuid);
    if (us && us.item) {
      return ApiDbTable.us;
    }

    const fait = this.w.data().objects.fait.all.findByUuid(uuid);
    if (fait && fait.item) {
      return ApiDbTable.fait;
    }

    return null;
  }

  paradoxKeyValueComparator = (a: any, b: any): number => {
    const orderA = this.paradoxDisplayOrder.indexOf(a.key);
    const orderB = this.paradoxDisplayOrder.indexOf(b.key);

    const indexA = orderA === -1 ? this.paradoxDisplayOrder.length : orderA;
    const indexB = orderB === -1 ? this.paradoxDisplayOrder.length : orderB;

    return indexA - indexB;
  };

  /**
   * Retourne la description du type de paradoxe pour le tooltip
   */
  getParadoxTypeDescription(typeId: string | null): string {
    const type = this.paradoxTypes.find(t => t.id === typeId);
    return type?.description || '';
  }
}