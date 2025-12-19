import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  DiagramParadoxVisualizationService,
  ParadoxNavigationState,
  ParadoxType
} from '../../../services/diagram-paradox-visualization.service';
import { ParadoxHighlight } from '../../../services/paradox-highlighters/paradox-highlighter.base';

@Component({
  selector: 'app-paradoxes-panel',
  templateUrl: './paradoxes-panel.component.html',
  styleUrls: ['./paradoxes-panel.component.scss']
})
export class ParadoxesPanelComponent implements OnInit, OnDestroy {

  @Input() isOpen: boolean = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  // État local
  activeTab: ParadoxType = 'all';
  paradoxes: ParadoxHighlight[] = [];
  filteredParadoxes: ParadoxHighlight[] = [];
  navigationState: ParadoxNavigationState;
  
  multiSelectMode: boolean = false;
  expandedParadoxes = new Set<string>();
  searchQuery: string = '';
  
  // Onglets disponibles
  tabs = [
    { id: 'all', label: 'Tous', icon: 'list-outline', color: 'primary' },
    { id: 'cycle', label: 'Cycles', icon: 'sync-circle-outline', color: 'danger' },
    { id: 'temporal', label: 'Temporels', icon: 'time-outline', color: 'warning' },
    { id: 'consistency', label: 'Cohérence', icon: 'git-compare-outline', color: 'tertiary' },
    { id: 'containment', label: 'Contenance', icon: 'folder-outline', color: 'secondary' }
  ];
  
  private destroy$ = new Subject<void>();

  constructor(public paradoxService: DiagramParadoxVisualizationService) {}

  ngOnInit(): void {
    // S'abonner aux paradoxes détectés
    this.paradoxService.detectedParadoxes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(paradoxes => {
        this.paradoxes = paradoxes;
        this.filterParadoxes();
      });

    // S'abonner à l'état de navigation
    this.paradoxService.navigationState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.navigationState = state;
        this.activeTab = state.activeType;
      });

    // S'abonner au type actif
    this.paradoxService.activeParadoxType$
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        this.activeTab = type;
        this.filterParadoxes();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.closed.emit();
  }

  /**
   * Change l'onglet actif
   */
  selectTab(tabId: string): void {
    this.activeTab = tabId as ParadoxType;
    this.paradoxService.setActiveParadoxType(this.activeTab);
    this.filterParadoxes();
  }

  /**
   * Filtre les paradoxes selon l'onglet actif et la recherche
   */
  private filterParadoxes(): void {
    let filtered = this.paradoxes;

    // Filtrer par type
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(p => p.type === this.activeTab);
    }

    // Filtrer par recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.displayName.toLowerCase().includes(query) ||
        p.shortMessage?.toLowerCase().includes(query)
      );
    }

    this.filteredParadoxes = filtered;
  }

  /**
   * Recherche
   */
  onSearchChange(): void {
    this.filterParadoxes();
  }

  /**
   * Clique sur un paradoxe
   */
  onParadoxClick(paradox: ParadoxHighlight, index: number, event: MouseEvent): void {
    if (this.multiSelectMode || event.ctrlKey || event.metaKey) {
      this.paradoxService.toggleParadoxSelection(paradox.paradoxId);
    } else {
      this.paradoxService.selectParadoxByIndex(index);
    }
  }

  /**
   * Navigation
   */
  previousParadox(): void {
    this.paradoxService.previousParadox();
  }

  nextParadox(): void {
    this.paradoxService.nextParadox();
  }

  /**
   * Vérifie si un paradoxe est sélectionné
   */
  isParadoxSelected(paradoxId: string): boolean {
    return this.paradoxService.isParadoxSelected(paradoxId);
  }

  /**
   * Vérifie si c'est le paradoxe actuel
   */
  isCurrentParadox(paradox: ParadoxHighlight): boolean {
    return this.navigationState?.currentParadox?.paradoxId === paradox.paradoxId;
  }

  /**
   * Toggle expansion d'un paradoxe
   */
  toggleParadoxExpansion(paradoxId: string): void {
    if (this.expandedParadoxes.has(paradoxId)) {
      this.expandedParadoxes.delete(paradoxId);
    } else {
      this.expandedParadoxes.add(paradoxId);
    }
  }

  /**
   * Mode sélection multiple
   */
  toggleMultiSelectMode(): void {
    this.multiSelectMode = !this.multiSelectMode;
  }

  selectAll(): void {
    this.paradoxService.selectAllParadoxes();
  }

  deselectAll(): void {
    this.paradoxService.deselectAllParadoxes();
  }

  /**
   * Compte le nombre de paradoxes par type
   */
  getCountForTab(tabId: string): number {
    if (tabId === 'all') {
      return this.paradoxes.length;
    }
    return this.paradoxes.filter(p => p.type === tabId).length;
  }

  /**
   * Obtient la couleur d'un paradoxe (synchronisée avec le diagramme)
   */
  getParadoxColor(paradox: ParadoxHighlight): string {
    return this.paradoxService.getParadoxColor(paradox);
  }
  /**
   * Formate les entités pour l'affichage (cycles)
   */
  getDisplayNodes(paradox: ParadoxHighlight): string[] {
    if (paradox.type === 'cycle' && paradox.metadata?.cycleNodes) {
      const nodes = paradox.metadata.cycleNodes;
      if (nodes.length <= 4) {
        return nodes;
      }
      return [...nodes.slice(0, 3), `+${nodes.length - 3}`];
    }
    return [];
  }

  /**
   * Formate le message court d'un paradoxe
   */
  getShortMessage(paradox: ParadoxHighlight): string {
    if (paradox.shortMessage) {
      return paradox.shortMessage;
    }
    
    switch (paradox.type) {
      case 'cycle':
        return `Cycle de ${paradox.metadata?.cycleNodes?.length || 0} entités`;
      case 'temporal':
        return `Contradiction temporelle entre ${paradox.relations.length} relations`;
      case 'consistency':
        return `Incohérence entre Faits`;
      case 'containment':
        return `Problème de contenance Fait-US`;
      default:
        return paradox.displayName;
    }
  }

  get selectedCount(): number {
    return this.navigationState?.selectedParadoxIds?.size || 0;
  }

  get currentIndex(): number {
    if (!this.navigationState) return -1;
    return this.navigationState.currentIndexByType.get(this.activeTab) || 0;
  }

  get totalCount(): number {
    if (!this.navigationState) return 0;
    return this.navigationState.totalByType.get(this.activeTab) || 0;
  }

  /**
   * Obtient l'icône pour un type de paradoxe
   */
  getParadoxIcon(type: string): string {
    switch (type) {
      case 'cycle': return 'sync-circle-outline';
      case 'temporal': return 'time-outline';
      case 'consistency': return 'git-compare-outline';
      case 'containment': return 'folder-outline';
      default: return 'warning-outline';
    }
  }

  /**
   * Obtient l'icône d'un onglet
   */
  getTabIcon(tabId: string): string {
    const tab = this.tabs.find(t => t.id === tabId);
    return tab?.icon || 'warning-outline';
  }

  /**
   * Obtient la couleur d'un onglet
   */
  getTabColor(tabId: string): string {
    const tab = this.tabs.find(t => t.id === tabId);
    return tab?.color || 'danger';
  }

  /**
   * Obtient le label d'un onglet
   */
  getTabLabel(tabId: string): string {
    const tab = this.tabs.find(t => t.id === tabId);
    return tab?.label || 'Paradoxes';
  }
}