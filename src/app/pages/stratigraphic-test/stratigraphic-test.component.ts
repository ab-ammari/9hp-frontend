import { Component, OnInit, OnDestroy } from '@angular/core';
import { WorkerService } from '../../services/worker.service';
import {CastorValidationService, CycleParadox, DetectedParadox} from '../../services/castor-validation.service';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { LOG, LoggerContext } from 'ngx-wcore';
import {ApiDbTable, ApiStratigraphie} from "../../../../shared";
import {ConfirmationService} from "../../services/confirmation.service";
import {AuthService} from "@auth0/auth0-angular";
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
    { id: null, name: 'Tous les types de paradoxes' },
    { id: 'containment', name: 'Paradoxes de contenance (US/Fait)' },
    { id: 'consistency', name: 'Paradoxes de cohérence entre Faits' },
    { id: 'temporal', name: 'Paradoxes temporels' },
    { id: 'cycle', name: 'Paradoxes de cycle' }
  ];

  // Sélection actuelle
  selectedParadoxType: 'containment' | 'consistency' | 'temporal' | 'cycle' | null = null;

  // État de la recherche
  isSearching: boolean = false;

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
    private authService : CastorAuthorizationService
  ) { }

  ngOnInit(): void {
    LOG.debug.log({...CONTEXT, action: 'ngOnInit'}, 'Initializing stratigraphic test component');

    // Subscribe to any data changes if needed
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

  /**
   * Lance la recherche de paradoxes stratigraphiques
   */
  findParadoxes(): void {
    LOG.debug.log({...CONTEXT, action: 'findParadoxes'}, `Searching for paradoxes of type: ${this.selectedParadoxType || 'all'}`);

    this.isSearching = true;
    this.paradoxResults = [];
    this.expandedCycles = {}; // Réinitialiser les états d'expansion des cycles

    setTimeout(() => {
      try {
        this.paradoxResults = this.validationService.findAllParadoxes(this.selectedParadoxType);
        LOG.debug.log({...CONTEXT, action: 'findParadoxes'}, `Found ${this.paradoxResults.length} paradoxes`);

        // Grouper les paradoxes par type
        this.groupParadoxesByType();

        // Initialiser explicitement tous les états d'expansion des cycles à false (fermés)
        this.initializeExpandedStates();

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


  /**
   * Renvoie le tag (identifiant lisible) d'une US
   */
  getUsTag(usUuid: string): string {
    const us = this.w.data().objects.us.all.findByUuid(usUuid);
    return us ? us.item.tag : usUuid;
  }

  /**
   * Renvoie le tag (identifiant lisible) d'un Fait
   */
  getFaitTag(faitUuid: string): string {
    const fait = this.w.data().objects.fait.all.findByUuid(faitUuid);
    return fait ? fait.item.tag : faitUuid;
  }

  /**
   * Formate le type de paradoxe pour l'affichage
   */
  formatParadoxType(type: string): string {
    const paradoxType = this.paradoxTypes.find(pt => pt.id === type);
    return paradoxType ? paradoxType.name : type;
  }

  // vérifier si un paradoxe est un cycle
  isCycleParadox(paradox: any): paradox is CycleParadox {
    return paradox.type === 'cycle' && 'cycleNodes' in paradox;
  }

  // Méthode pour formater le cycle pour l'affichage
  formatCycle(cycleNodes: string[]): string {
    return cycleNodes.join(' → ') + ' → ' + cycleNodes[0];
  }

  // Méthode pour initialiser les états après avoir reçu les résultats
  initAccordionStates(): void {
    if (this.paradoxResults) {
      // Initialiser tous les accordéons comme fermés
      this.isExpanded = new Array(this.paradoxResults.length).fill(false);
    }
  }

  groupParadoxesByType(): void {
    this.groupedParadoxes.clear();
    this.expandedGroups = {};

    // Initialiser les groupes avec des arrays vides
    this.paradoxTypes.forEach(type => {
      if (type.id) { // Ignorer le "Tous les types"
        this.groupedParadoxes.set(type.id, []);
        this.expandedGroups[type.id] = false; // Par défaut, tous les groupes sont cachee
      }
    });

    // Regrouper les paradoxes par type
    this.paradoxResults.forEach(paradox => {
      const type = paradox.type || 'unknown';
      if (!this.groupedParadoxes.has(type)) {
        this.groupedParadoxes.set(type, []);
      }
      this.groupedParadoxes.get(type).push(paradox);
    });
  }

  // Toggle pour un groupe de paradoxes
  toggleGroupExpand(type: string): void {
    this.expandedGroups[type] = !this.expandedGroups[type];
  }


// Toggle pour un cycle spécifique
  isCycleExpanded(groupKey: string, index: number): boolean {
    return !!this.expandedCycles[this.buildCycleKey(groupKey, index)];
  }

  toggleCycleExpand(groupKey: string, cycleIndex: number, event?: Event): void {
    // Empêcher la propagation de l'événement pour éviter les conflits
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

// Compter les relations impliquées dans un cycle
  getInvolvedRelationsCount(paradox: any): number {
    if (this.isCycleParadox(paradox)) {
      return paradox.allRelations?.length || 0;
    }
    return paradox.relations?.length || 0;
  }


  /**
   * Version sécurisée du formatage de relation
   */
  formatRelationAsText(relation: ApiStratigraphie): string {
    if (!relation) {
      return 'Relation indéfinie';
    }

    try {
      let entity1 = '';
      let entity2 = '';
      let relationType = '';

      // Déterminer la première entité (anterieure)
      if (relation.us_anterieur) {
        entity1 = `US ${this.getUsTag(relation.us_anterieur)}`;
      } else if (relation.fait_anterieur) {
        entity1 = `Fait ${this.getFaitTag(relation.fait_anterieur)}`;
      } else {
        entity1 = 'Entité inconnue';
      }

      // Déterminer la seconde entité (postérieure)
      if (relation.us_posterieur) {
        entity2 = `US ${this.getUsTag(relation.us_posterieur)}`;
      } else if (relation.fait_posterieur) {
        entity2 = `Fait ${this.getFaitTag(relation.fait_posterieur)}`;
      } else {
        entity2 = 'Entité inconnue';
      }

      // Déterminer le type de relation
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

  /**
   * Version améliorée de la suppression avec gestion d'état
   */
  deleteRelation(relation: ApiStratigraphie, event?: Event): void {
    if (this.isDeletingRelation) {
      return; // Éviter les suppressions multiples
    }

    // Empêcher la propagation de l'événement si fourni
    if (event) {
      event.stopPropagation();
    }

    if (this.authService.canDeleteRelation(relation)) {
      this.confirmationService.showConfirmDialog(
        'Supprimer la relation',
        `Êtes-vous sûr de vouloir supprimer la relation : "${this.formatRelationAsText(relation)}" ?`,
        () => {
          this.isDeletingRelation = true;

          // Action de suppression
          relation.live = false;
          this.w.data().objects.stratigraphie.selected.commit(relation).subscribe(
            () => {
              console.log('Relation supprimée avec succès');

              // Attendre un court instant pour assurer la synchronisation des données
              setTimeout(() => {
                this.findParadoxes();
                this.isDeletingRelation = false;
              }, 100);
            },
            error => {
              console.error('Erreur lors de la suppression de la relation', error);
              this.isDeletingRelation = false;

              // Afficher un message d'erreur à l'utilisateur
              this.confirmationService.showConfirmDialog(
                'Erreur',
                'Une erreur est survenue lors de la suppression de la relation.',
                () => {}, // Action vide pour le bouton OK
                () => {}, // Action vide pour le bouton Annuler
                'OK',
                null // Pas de bouton d'annulation
              );
            }
          );
        },
        () => {
          // Action en cas d'annulation
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

  /**
   * Simule la suppression d'une relation et analyse l'impact
   */
  simulateRelationRemoval(relation: ApiStratigraphie, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    // Stocker l'état actuel des paradoxes
    this.simulationResults.originalParadoxes = [...this.paradoxResults];
    this.simulationResults.removedRelation = relation;

    // Sauvegarder l'état actuel pour pouvoir le restaurer après
    const currentLiveState = relation.live;

    // Simuler la suppression
    relation.live = false;

    // Exécuter la recherche de paradoxes avec la relation temporairement supprimée
    LOG.debug.log({...CONTEXT, action: 'simulateRelationRemoval'}, `Simulation de la suppression de la relation: ${relation.stratigraphie_uuid}`);

    setTimeout(() => {
      try {
        const simulatedResults = this.validationService.findAllParadoxes() as (DetectedParadox & { isExpanded?: boolean })[];
        this.simulationResults.simulatedParadoxes = simulatedResults;

        // Calculer les statistiques de l'impact
        this.calculateImpactStatistics();

        // Activer l'affichage du résultat de la simulation
        this.simulationResults.isActive = true;

        LOG.debug.log(
          {...CONTEXT, action: 'simulateRelationRemoval'},
          `Simulation terminée. Paradoxes avant: ${this.simulationResults.originalParadoxes.length}, après: ${this.simulationResults.simulatedParadoxes.length}`
        );
      } catch (error) {
        console.error('Erreur lors de la simulation', error);
      } finally {
        // Restaurer l'état original de la relation
        relation.live = currentLiveState;
      }
    }, 100);
  }

  /**
   * Calcule les statistiques d'impact de la suppression simulée
   */
  calculateImpactStatistics(): void {
    // Compter les paradoxes par type avant/après
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

    // Logs pour le débogage
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

  /**
   * Ferme la prévisualisation de l'impact
   */
  closeImpactPreview(): void {
    this.simulationResults.isActive = false;
  }

  /**
   * Confirme la suppression après avoir vu l'impact
   */
  confirmRemovalAfterImpactPreview(): void {
    if (this.simulationResults.removedRelation) {
      // Utiliser la méthode deleteRelation existante
      this.deleteRelation(this.simulationResults.removedRelation);
      // Fermer la prévisualisation
      this.closeImpactPreview();
    }
  }

  /**
   * Génère un message court pour l'en-tête si non fourni
   */
  getShortMessage(paradox: DetectedParadox): string {
    if (paradox.shortMessage) {
      return paradox.shortMessage;
    }

    // Extraire la première phrase du message complet
    const firstSentence = paradox.message.split('.')[0];

    // Si c'est trop long, tronquer intelligemment
    if (firstSentence.length > 150) {
      return firstSentence.substring(0, 147) + '...';
    }

    return firstSentence;
  }

  /**
   * determiner le type de entité uuid => US ou Fait
   */
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

  /**
   * Comparateur pour ordonner les paradoxes selon notre ordre personnalisé
   */
  paradoxKeyValueComparator = (a: any, b: any): number => {
    const orderA = this.paradoxDisplayOrder.indexOf(a.key);
    const orderB = this.paradoxDisplayOrder.indexOf(b.key);

    // Si le type n'est pas dans l'ordre défini, le mettre à la fin
    const indexA = orderA === -1 ? this.paradoxDisplayOrder.length : orderA;
    const indexB = orderB === -1 ? this.paradoxDisplayOrder.length : orderB;

    return indexA - indexB;
  };
}
