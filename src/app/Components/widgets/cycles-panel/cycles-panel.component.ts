import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  DiagramParadoxModeService,
  CycleHighlightInfo,
  ParadoxNavigationState
} from '../../../services/diagram-paradox-mode.service';

@Component({
  selector: 'app-cycles-panel',
  templateUrl: './cycles-panel.component.html',
  styleUrls: ['./cycles-panel.component.scss']
})
export class CyclesPanelComponent implements OnInit, OnDestroy {

  @Input() isOpen: boolean = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  cycles: CycleHighlightInfo[] = [];
  
  // CORRECTION: Ajouter selectedCycleIds avec valeur par défaut
  navigationState: ParadoxNavigationState = {
    currentIndex: -1,
    totalCycles:  0,
    currentCycle: null,
    selectedCycleIds:  new Set<string>()  // <-- Ajouté
  };

  // Mode de sélection
  multiSelectMode: boolean = false;

  private destroy$ = new Subject<void>();

    /**
   * Palette de couleurs pour les cycles (synchronisée avec le diagramme)
   */
  private readonly cycleColors = [
    '#e91e63',  // Rose
    '#9c27b0',  // Violet
    '#673ab7',  // Violet foncé
    '#3f51b5',  // Indigo
    '#f44336',  // Rouge
    '#ff5722',  // Orange foncé
    '#ff9800',  // Orange
    '#4caf50',  // Vert
  ];

  constructor(public paradoxService: DiagramParadoxModeService) {}

  ngOnInit(): void {
    // S'abonner aux cycles détectés
    this.paradoxService.detectedCycles$
      .pipe(takeUntil(this. destroy$))
      .subscribe(cycles => {
        this.cycles = cycles;
      });

    // S'abonner à l'état de navigation
    this. paradoxService.navigationState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.navigationState = state;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(): void {
    this.isOpen = false;
    this. isOpenChange.emit(false);
    this.closed.emit();
  }

  /**
   * Sélectionne un cycle (mode simple ou multiple)
   */
  onCycleClick(cycle: CycleHighlightInfo, index: number, event: MouseEvent): void {
    if (this.multiSelectMode || event.ctrlKey || event.metaKey) {
      // Mode sélection multiple
      this.paradoxService.toggleCycleSelection(cycle.cycleId);
    } else {
      // Mode sélection simple
      this.paradoxService.selectCycleByIndex(index);
    }
  }

  /**
   * Navigation:  cycle précédent
   */
  previousCycle(): void {
    this.paradoxService.previousCycle();
  }

  /**
   * Navigation: cycle suivant
   */
  nextCycle(): void {
    this.paradoxService.nextCycle();
  }

  /**
   * Vérifie si un cycle est sélectionné
   */
  isCycleSelected(cycleId: string): boolean {
    return this.paradoxService.isCycleSelected(cycleId);
  }

  /**
   * Vérifie si c'est le cycle actif (navigation)
   */
  isCurrentCycle(index: number): boolean {
    return this.navigationState.currentIndex === index;
  }

  /**
   * Toggle le mode de sélection multiple
   */
  toggleMultiSelectMode(): void {
    this.multiSelectMode = !this.multiSelectMode;

    if (! this.multiSelectMode) {
      // Revenir à la sélection simple du cycle actuel
      if (this.navigationState.currentIndex >= 0) {
        this.paradoxService.selectCycleByIndex(this.navigationState.currentIndex);
      }
    }
  }

  /**
   * Sélectionne tous les cycles
   */
  selectAll(): void {
    this.paradoxService.selectAllCycles();
  }

  /**
   * Désélectionne tous les cycles
   */
  deselectAll(): void {
    this.paradoxService.deselectAllCycles();
  }

  /**
   * Formate les nœuds pour l'affichage (aperçu limité)
   */
  getDisplayNodes(cycle: CycleHighlightInfo): string[] {
    const nodes = cycle.cycleNodes;
    if (nodes.length <= 4) {
      return nodes;
    }
    return [... nodes. slice(0, 3), `+${nodes.length - 3}`];
  }

  /**
   * Retourne le titre du cycle
   */
  getCycleTitle(index: number): string {
    return `Cycle ${index + 1}`;
  }

  /**
   * Retourne le nombre de cycles sélectionnés
   */
  get selectedCount(): number {
    return this.navigationState.selectedCycleIds.size;
  }

  /**
   * Retourne la couleur principale du cycle
   */
  getCycleColor(index: number): string {
    return this.cycleColors[index % this.cycleColors.length];
  }

  /**
   * Retourne la couleur de fond (version transparente) pour l'ion-item sélectionné
   */
  getCycleBackgroundColor(index: number): string {
    const color = this.cycleColors[index % this.cycleColors.length];
    // Convertir en rgba avec 15% d'opacité
    return this.hexToRgba(color, 0.15);
  }

  /**
   * Retourne la couleur pour les chips (version plus claire)
   */
  getCycleChipColor(index:  number): string {
    const color = this.cycleColors[index % this.cycleColors.length];
    return this.hexToRgba(color, 0.2);
  }

  /**
   * Convertit une couleur hex en rgba
   */
  private hexToRgba(hex:  string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex. slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}