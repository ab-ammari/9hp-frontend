import {Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Inject} from '@angular/core';
import { WorkerService } from '../../services/worker.service';
import { StratigraphicDiagramService, DiagramConfig, DiagramNode } from '../../services/stratigraphic-diagram.service';
import { ApiStratigraphie } from '../../../../shared';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import panzoom from 'panzoom';
import {DOCUMENT} from "@angular/common";

export type MermaidLayoutMode = 'default' | 'elk' | 'dagre-d3';

interface IsolatedEntity {
  uuid: string;
  label: string;
  type: 'us' | 'fait';
  childrenUS?: IsolatedEntity[];
}

@Component({
  selector: 'app-stratigraphic-diagram',
  templateUrl: './stratigraphic-diagram.component.html',
  styleUrls: ['./stratigraphic-diagram.component.scss']
})
export class StratigraphicDiagramComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('diagramContainer', { static: false }) diagramContainer!: ElementRef;

  private destroyer$ = new Subject<void>();
  private panzoomInstance: any;

  isControlPanelOpen = false;
  isStatsPanelOpen = false;
  isSearchPanelOpen = false;
  isLayoutPanelOpen = false;

  diagramConfig: DiagramConfig = {
    includeUS: true,
    includeFaits: true,
    includeContemporaryRelations: true,
    highlightCycles: true,
    groupContemporaries: true,
  };

  isGenerating = false;
  isExporting = false;
  currentMermaidCode = '';
  errorMessage = '';

  searchQuery = '';
  searchResults: DiagramNode[] = [];
  allNodes: DiagramNode[] = [];

  focusNodeSearchQuery = '';
  focusNodeSearchResults: DiagramNode[] = [];
  showFocusNodeSuggestions = false;

  currentLayoutMode: MermaidLayoutMode = 'default';
  layoutModes: { value: MermaidLayoutMode; label: string; description: string }[] = [
    { value: 'default', label: 'Par défaut', description: 'Layout flowchart standard de Mermaid' },
    { value: 'elk', label: 'ELK', description: 'Eclipse Layout Kernel - meilleur pour les grands graphes' },
    { value: 'dagre-d3', label: 'Dagre-D3', description: 'Layout hiérarchique optimisé' }
  ];

  stats = {
    totalNodes: 0,
    totalEdges: 0,
    usCount: 0,
    faitCount: 0,
    isolatedCount: 0
  };

  filterOptions = {
    maxDepth: null as number | null,
    focusNodeUuid: null as string | null
  };

  isFullscreen = false;

  isIsolatedPanelOpen = false;
  isolatedFilters = {
    showFaits: true,
    showUS: true
  };

  isolatedEntities: IsolatedEntity[] = [];
  filteredIsolatedEntities: IsolatedEntity[] = [];
  expandedFaits = new Set<string>();
  isolatedSearchQuery = '';

  constructor(
    public w: WorkerService,
    private diagramService: StratigraphicDiagramService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.w.data().objects.stratigraphie.all.onValueChange()
      .pipe(takeUntil(this.destroyer$))
      .subscribe(() => {
        if (this.currentMermaidCode) {
          this.generateDiagram();
        }
      });
    this.document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.destroyer$.next();
    this.destroyer$.complete();

    if (this.panzoomInstance) {
      this.panzoomInstance.dispose();
    }
    this.document.removeEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
  }

  private onFullscreenChange(): void {
    this.isFullscreen = !!this.document.fullscreenElement;
    setTimeout(() => {
      if (this.panzoomInstance) {
        this.disposePanZoom();
        this.initializePanZoom();
      }
    }, 100);
  }

  toggleFullscreen(): void {
    if (!this.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  private enterFullscreen(): void {
    const elem = this.diagramContainer.nativeElement.closest('.diagram-display');

    if (elem?.requestFullscreen) {
      elem.requestFullscreen().catch((err: any) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    }
  }

  private exitFullscreen(): void {
    if (this.document.exitFullscreen) {
      this.document.exitFullscreen();
    }
  }

  // === Gestion des panneaux ===

  openControlPanel(): void {
    this.isControlPanelOpen = true;
    this.isStatsPanelOpen = false;
    this.isSearchPanelOpen = false;
    this.isLayoutPanelOpen = false;
  }

  onControlPanelClosed(): void {
    this.isControlPanelOpen = false;
  }

  toggleStatsPanel(): void {
    this.isStatsPanelOpen = !this.isStatsPanelOpen;
    if (this.isStatsPanelOpen) {
      this.isControlPanelOpen = false;
      this.isSearchPanelOpen = false;
      this.isLayoutPanelOpen = false;
    }
  }

  onStatsPanelClosed(): void {
    this.isStatsPanelOpen = false;
  }

  // === Recherche d'entités ===

  toggleSearchPanel(): void {
    this.isSearchPanelOpen = !this.isSearchPanelOpen;
    if (this.isSearchPanelOpen) {
      this.isControlPanelOpen = false;
      this.isStatsPanelOpen = false;
      this.isLayoutPanelOpen = false;
      this.updateSearchResults();
    }
  }

  onSearchPanelClosed(): void {
    this.isSearchPanelOpen = false;
  }

  onSearchQueryChange(): void {
    this.updateSearchResults();
  }

  private updateSearchResults(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = this.allNodes.slice(0, 20); // Afficher les 20 premiers par défaut
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.searchResults = this.allNodes.filter(node =>
      node.label.toLowerCase().includes(query) ||
      node.uuid.toLowerCase().includes(query)
    ).slice(0, 50); // Limiter à 50 résultats
  }

  zoomToEntity(node: DiagramNode): void {
    if (! this.panzoomInstance || !this.diagramContainer) {
      return;
    }

    const container = this.diagramContainer. nativeElement;
    const svg = container.querySelector('svg');

    if (!svg) {
      return;
    }

    const nodeElement = this.findNodeElementInSVG(svg, node);

    if (nodeElement) {
      this.centerOnNode(nodeElement);

      this.highlightNode(nodeElement);

      this.isSearchPanelOpen = false;
    } else {
      console.warn('Nœud non trouvé dans le SVG:', node);
    }
  }

  private findNodeElementInSVG(svg: SVGElement, node: DiagramNode): Element | null {
    const sanitizedId = 'node_' + node.uuid.replace(/-/g, '_');

    let nodeElement = svg.querySelector(`g.node#${sanitizedId}`);
    if (nodeElement) {
      console.log('Nœud trouvé par ID exact:', sanitizedId);
      return nodeElement;
    }

    nodeElement = svg. querySelector(`g.node[id*="${sanitizedId}"]`);
    if (nodeElement) {
      console.log('Nœud trouvé par ID partiel:', sanitizedId);
      return nodeElement;
    }

    const textElements = svg.querySelectorAll('g.node text');
    for (const textEl of Array.from(textElements)) {
      const textContent = textEl. textContent?.trim() || '';

      if (textContent === node.label) {
        const parentNode = textEl.closest('g.node');
        if (parentNode) {
          console.log('Nœud trouvé par label exact:', node.label);
          return parentNode;
        }
      }
    }

    for (const textEl of Array.from(textElements)) {
      const textContent = textEl.textContent || '';
      if (textContent. includes(node.uuid)) {
        const parentNode = textEl.closest('g.node');
        if (parentNode) {
          console. log('Nœud trouvé par UUID dans le texte:', node.uuid);
          return parentNode;
        }
      }
    }

    console.error('Nœud introuvable avec:', { uuid: node.uuid, label: node.label, sanitizedId });
    return null;
  }

  private centerOnNode(nodeElement: Element): void {
    if (!this.panzoomInstance || !this.diagramContainer) {
      return;
    }

    const container = this.diagramContainer. nativeElement;
    const containerRect = container.getBoundingClientRect();
    const nodeRect = nodeElement.getBoundingClientRect();

    const currentTransform = this.panzoomInstance.getTransform();
    const currentScale = currentTransform.scale;

    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;

    const nodeCenterX = nodeRect.left - containerRect.left + nodeRect.width / 2;
    const nodeCenterY = nodeRect.top - containerRect.top + nodeRect. height / 2;

    const offsetX = containerCenterX - nodeCenterX;
    const offsetY = containerCenterY - nodeCenterY;

    const newX = currentTransform.x + offsetX;
    const newY = currentTransform.y + offsetY;

    this.panzoomInstance.moveTo(newX, newY);

    console.log('nœud centré:', { offsetX, offsetY, scale: currentScale });
  }

  private highlightNode(nodeElement: Element): void {
    const svg = nodeElement.closest('svg');
    if (svg) {
      svg.querySelectorAll('.highlighted-node').forEach(el => {
        el.classList.remove('highlighted-node');
        (el as HTMLElement).style.filter = '';
      });
    }

    nodeElement.classList.add('highlighted-node');

    const shapes = nodeElement.querySelectorAll('rect, polygon, circle, ellipse, path');
    shapes.forEach(shape => {
      (shape as HTMLElement).style.filter = 'drop-shadow(0 0 10px #4CAF50) drop-shadow(0 0 20px #4CAF50) drop-shadow(0 0 30px #4CAF50)';
      (shape as HTMLElement).style. transition = 'filter 0.3s ease';
    });

    setTimeout(() => {
      nodeElement.classList. remove('highlighted-node');
      shapes.forEach(shape => {
        (shape as HTMLElement).style. filter = '';
      });
    }, 3000);

    console.log('Surbrillance appliquée sur:', nodeElement);
  }

  // === Mode de layout ===

  toggleLayoutPanel(): void {
    this.isLayoutPanelOpen = !this.isLayoutPanelOpen;
    if (this.isLayoutPanelOpen) {
      this.isControlPanelOpen = false;
      this.isStatsPanelOpen = false;
      this.isSearchPanelOpen = false;
    }
  }

  onLayoutPanelClosed(): void {
    this.isLayoutPanelOpen = false;
  }

  selectLayoutMode(mode: MermaidLayoutMode): void {
    if (this.currentLayoutMode !== mode) {
      this.currentLayoutMode = mode;
      this.diagramService.setLayoutMode(mode);

      if (this.currentMermaidCode) {
        this.generateDiagram();
      }
    }
    this.isLayoutPanelOpen = false;
  }

  // === Génération du diagramme ===

  async generateDiagram(): Promise<void> {
    this.isGenerating = true;
    this.errorMessage = '';

    try {
      if (!this.isContainerReady()) {
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!this.isContainerReady()) {
          this.errorMessage = 'Le conteneur du diagramme n\'est pas encore prêt. Veuillez réessayer.';
          console.error('Container not ready:', this.diagramContainer);
          return;
        }
      }

      const relations = this.w.data().objects.stratigraphie.all.list
        .map(item => item.item)
        .filter(rel => rel && rel.live !== false);

      if (relations.length === 0) {
        this.errorMessage = 'Aucune relation stratigraphique disponible';
        return;
      }

      const config: DiagramConfig = {
        ...this.diagramConfig,
        maxDepth: this.filterOptions.maxDepth || undefined,
        focusNode: this.filterOptions.focusNodeUuid || undefined
      };

      // Générer le code et récupérer les nœuds pour la recherche
      const result = this.diagramService.generateMermaidCodeWithNodes(relations, config);
      this.currentMermaidCode = result.code;
      this.allNodes = result.nodes;

      this.calculateStats(relations);
      await this.renderDiagram();

      setTimeout(() => {
        this.disposePanZoom();
        this.initializePanZoom();
        this.centerDiagram();
      }, 300);

      this.isControlPanelOpen = false;

    } catch (error) {
      console.error('Erreur lors de la génération du diagramme:', error);
      this.errorMessage = 'Erreur lors de la génération du diagramme: ' + (error as Error).message;
    } finally {
      this.isGenerating = false;
    }
  }

  private isContainerReady(): boolean {
    return !!(this.diagramContainer && this.diagramContainer.nativeElement);
  }

  private async renderDiagram(): Promise<void> {
    if (!this.diagramContainer || !this.diagramContainer.nativeElement) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!this.diagramContainer || !this.diagramContainer.nativeElement) {
      throw new Error('Conteneur du diagramme non disponible. Vérifiez le template HTML.');
    }

    const container = this.diagramContainer.nativeElement;

    if (!container.id) {
      container.id = 'diagram-container-' + Date.now();
    }

    const containerId = container.id;

    try {
      await this.diagramService.renderDiagram(containerId, this.currentMermaidCode);
    } catch (error) {
      console.error('Erreur lors du rendu Mermaid:', error);
      throw new Error('Impossible de générer le diagramme: ' + (error as Error).message);
    }
  }

  // === Pan/Zoom ===

  private disposePanZoom(): void {
    if (this.panzoomInstance) {
      this.panzoomInstance.dispose();
      this.panzoomInstance = null;
    }
  }

  private initializePanZoom(): void {
    if (!this.diagramContainer) {
      console.warn('Container not available for panzoom');
      return;
    }

    const element = this.diagramContainer.nativeElement.querySelector('svg');

    if (!element) {
      console.warn('SVG element not found for panzoom');
      return;
    }

    if (this.panzoomInstance) {
      this.disposePanZoom();
    }

    this.panzoomInstance = panzoom(element, {
      maxZoom: 5,
      minZoom: 0.1,
      bounds: true,
      boundsPadding: 0.1,
      zoomDoubleClickSpeed: 1,
      smoothScroll: false,
      filterKey: () => true,
    });

    console.log('Panzoom initialized successfully');
  }

  resetPanZoom(): void {
    if (this.panzoomInstance) {
      this.panzoomInstance.moveTo(0, 0);
      this.panzoomInstance.zoomAbs(0, 0, 1);
    }
  }

  zoomIn(): void {
    if (this.panzoomInstance) {
      const container = this.diagramContainer.nativeElement;
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      this.panzoomInstance.smoothZoom(centerX, centerY, 1.2);
    }
  }

  zoomOut(): void {
    if (this.panzoomInstance) {
      const container = this.diagramContainer.nativeElement;
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      this.panzoomInstance.smoothZoom(centerX, centerY, 0.8);
    }
  }

  centerDiagram(): void {
    if (this.panzoomInstance) {
      const container = this.diagramContainer.nativeElement;
      const svg = container.querySelector('svg');

      if (svg) {
        const containerRect = container.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        const scaleX = containerRect.width / svgRect.width;
        const scaleY = containerRect.height / svgRect.height;
        const scale = Math.min(scaleX, scaleY, 1) * 0.9;

        this.panzoomInstance.moveTo(0, 0);
        this.panzoomInstance.zoomAbs(0, 0, scale);

        const transform = this.panzoomInstance.getTransform();
        const offsetX = (containerRect.width - svgRect.width * scale) / 2;
        const offsetY = (containerRect.height - svgRect.height * scale) / 2;
        this.panzoomInstance.moveTo(offsetX, offsetY);
      } else {
        this.resetPanZoom();
      }
    }
  }

  // === Configuration ===

  toggleConfigOption(option: keyof DiagramConfig): void {
    (this.diagramConfig as any)[option] = !(this.diagramConfig as any)[option];

    if (this.currentMermaidCode) {
      this.generateDiagram();
    }
  }

  // === Filtres ===

  applyDepthFilter(): void {
    if (this.currentMermaidCode) {
      this.generateDiagram();
    }
  }

  onFocusNodeSearchChange(event: any): void {
    const query = event.target.value || '';
    this.focusNodeSearchQuery = query;

    if (! query.trim()) {
      this.focusNodeSearchResults = [];
      this.showFocusNodeSuggestions = false;
      return;
    }

    this.showFocusNodeSuggestions = true;
    const searchQuery = query.toLowerCase(). trim();

    this.focusNodeSearchResults = this.allNodes.filter(node =>
      node.label.toLowerCase().includes(searchQuery) ||
      node.uuid.toLowerCase().includes(searchQuery)
    ). slice(0, 10); // Limiter à 10 résultats
  }

  selectFocusNode(node: DiagramNode): void {
    this.filterOptions.focusNodeUuid = node.uuid;
    this.focusNodeSearchQuery = `${node.label} (${node.type. toUpperCase()})`;
    this.showFocusNodeSuggestions = false;
  }

  clearFocusNodeSelection(): void {
    this. filterOptions.focusNodeUuid = null;
    this.focusNodeSearchQuery = '';
    this. focusNodeSearchResults = [];
    this.showFocusNodeSuggestions = false;
  }

  onFocusNodeInputFocus(): void {
    if (this.focusNodeSearchQuery && this.focusNodeSearchResults. length > 0) {
      this.showFocusNodeSuggestions = true;
    }
  }

  onFocusNodeInputBlur(): void {
    setTimeout(() => {
      this.showFocusNodeSuggestions = false;
    }, 200);
  }



  clearFilters(): void {
    this.filterOptions.maxDepth = null;
    this.clearFocusNodeSelection();
    this.generateDiagram();
  }

  get hasActiveFilters(): boolean {
    return this.filterOptions.maxDepth !== null || this.filterOptions.focusNodeUuid !== null;
  }

  // === Export ===

  async copyMermaidCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.currentMermaidCode);
      console.log('Code Mermaid copié dans le presse-papier');
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  }

  async exportSVG(): Promise<void> {
    this.isExporting = true;
    try {
      const containerId = this.diagramContainer.nativeElement.id || 'diagram-container';
      await this.diagramService.exportToSVG(containerId);
    } catch (error) {
      console. error('Erreur lors de l\'export SVG:', error);
      this.errorMessage = 'Erreur lors de l\'export SVG';
    } finally {
      this.isExporting = false;
    }
  }

  // === Statistiques ===

  private calculateStats(relations: ApiStratigraphie[]): void {
    const nodes = new Set<string>();
    let usCount = 0;
    let faitCount = 0;

    relations.forEach(rel => {
      if (rel.us_anterieur) {
        nodes.add(rel.us_anterieur);
        usCount++;
      }
      if (rel.us_posterieur) {
        nodes.add(rel.us_posterieur);
        usCount++;
      }
      if (rel.fait_anterieur) {
        nodes.add(rel.fait_anterieur);
        faitCount++;
      }
      if (rel.fait_posterieur) {
        nodes.add(rel.fait_posterieur);
        faitCount++;
      }
    });

    this.stats = {
      totalNodes: nodes.size,
      totalEdges: relations.length,
      usCount: Math.floor(usCount / 2),
      faitCount: Math.floor(faitCount / 2),
      isolatedCount: this. calculateIsolatedEntities(relations)
    };
  }

  toggleIsolatedPanel(): void {
    this.isIsolatedPanelOpen = ! this.isIsolatedPanelOpen;
    if (this.isIsolatedPanelOpen) {
      this.isControlPanelOpen = false;
      this.isStatsPanelOpen = false;
      this.isSearchPanelOpen = false;
      this.isLayoutPanelOpen = false;
      this.updateIsolatedEntities();
    }
  }

  onIsolatedPanelClosed(): void {
    this.isIsolatedPanelOpen = false;
    this.isolatedSearchQuery = '';
  }

  toggleIsolatedFilter(filterType: 'faits' | 'us'): void {
    if (filterType === 'faits') {
      this.isolatedFilters.showFaits = !this.isolatedFilters.showFaits;
    } else {
      this.isolatedFilters.showUS = !this.isolatedFilters.showUS;
    }
    this.updateIsolatedEntities();
  }

  toggleFaitExpansion(faitUuid: string): void {
    if (this.expandedFaits.has(faitUuid)) {
      this.expandedFaits.delete(faitUuid);
    } else {
      this.expandedFaits.add(faitUuid);
    }
  }

  onIsolatedSearchChange(): void {
    this.filterIsolatedEntities();
  }

  private filterIsolatedEntities(): void {
    if (!this.isolatedSearchQuery. trim()) {
      this.filteredIsolatedEntities = this.isolatedEntities;
      return;
    }

    const query = this.isolatedSearchQuery. toLowerCase(). trim();

    this.filteredIsolatedEntities = this.isolatedEntities.filter(entity => {
      const matchesEntity = entity.label.toLowerCase().includes(query) ||
        entity.uuid.toLowerCase().includes(query);

      if (entity.type === 'fait' && entity.childrenUS) {
        const matchesChildren = entity.childrenUS.some(child =>
          child.label.toLowerCase(). includes(query) ||
          child.uuid.toLowerCase().includes(query)
        );
        return matchesEntity || matchesChildren;
      }

      return matchesEntity;
    });
  }

  updateIsolatedEntities(): void {
    const relations = this.w. data().objects.stratigraphie.all.list
      .map(item => item.item)
      .filter(rel => rel && rel.live !== false);

    const connectedUUIDs = new Set<string>();

    relations.forEach(rel => {
      if (rel. us_anterieur) connectedUUIDs.add(rel.us_anterieur);
      if (rel.us_posterieur) connectedUUIDs.add(rel.us_posterieur);
      if (rel.fait_anterieur) connectedUUIDs.add(rel.fait_anterieur);
      if (rel.fait_posterieur) connectedUUIDs.add(rel.fait_posterieur);
    });

    const isolated: IsolatedEntity[] = [];

    if (this.isolatedFilters. showFaits) {
      this.w.data().objects.fait.all.list.forEach(faitWrapper => {
        const fait = faitWrapper.item;
        if (fait && fait.live !== false && !connectedUUIDs.has(fait.fait_uuid)) {
          const childrenUS: IsolatedEntity[] = [];

          this.w.data().objects.us.all.list.forEach(usWrapper => {
            const us = usWrapper.item;
            if (us && us.live !== false && us.fait_uuid === fait.fait_uuid) {
              if (!connectedUUIDs.has(us.us_uuid)) {
                childrenUS.push({
                  uuid: us.us_uuid,
                  label: us.tag || us.us_uuid.substring(0, 8),
                  type: 'us'
                });
              }
            }
          });

          isolated. push({
            uuid: fait. fait_uuid,
            label: fait.tag || fait.fait_uuid.substring(0, 8),
            type: 'fait',
            childrenUS: childrenUS.length > 0 ? childrenUS : undefined
          });
        }
      });
    }

    if (this. isolatedFilters.showUS) {
      this.w.data().objects.us.all.list.forEach(usWrapper => {
        const us = usWrapper.item;
        if (us && us.live !== false && !connectedUUIDs.has(us. us_uuid)) {
          // Vérifier si l'US n'est pas déjà dans un Fait isolé
          const isInIsolatedFait = isolated.some(
            entity => entity.type === 'fait' &&
              entity.childrenUS?.some(child => child.uuid === us. us_uuid)
          );

          if (!isInIsolatedFait) {
            isolated. push({
              uuid: us. us_uuid,
              label: us.tag || us.us_uuid.substring(0, 8),
              type: 'us'
            });
          }
        }
      });
    }

    isolated.sort((a, b) => {
      if (a.type === b.type) {
        return a.label.localeCompare(b.label);
      }
      return a. type === 'fait' ? -1 : 1;
    });

    this.isolatedEntities = isolated;
    this.filterIsolatedEntities();
  }

  /**
   * Calcule le nombre d'entités isolées (US + Faits sans relations)
   */
  private calculateIsolatedEntities(relations: ApiStratigraphie[]): number {
    const connectedUUIDs = new Set<string>();

    relations.forEach(rel => {
      if (rel. us_anterieur) connectedUUIDs.add(rel.us_anterieur);
      if (rel.us_posterieur) connectedUUIDs. add(rel.us_posterieur);
      if (rel.fait_anterieur) connectedUUIDs.add(rel.fait_anterieur);
      if (rel. fait_posterieur) connectedUUIDs.add(rel.fait_posterieur);
    });

    let isolatedCount = 0;

    this.w.data(). objects.fait.all. list.forEach(faitWrapper => {
      const fait = faitWrapper.item;
      if (fait && fait.live !== false && ! connectedUUIDs.has(fait.fait_uuid)) {
        isolatedCount++;
      }
    });

    this.w.data().objects.us.all. list.forEach(usWrapper => {
      const us = usWrapper.item;
      if (us && us.live !== false && !connectedUUIDs. has(us.us_uuid)) {
        if (us.fait_uuid) {
          const parentFait = this.w.data().objects.fait.all.findByUuid(us.fait_uuid);
          if (parentFait && parentFait.item. live !== false && !connectedUUIDs.has(us.fait_uuid)) {
            return;
          }
        }
        isolatedCount++;
      }
    });

    return isolatedCount;
  }

  openIsolatedPanelFromStats(): void {
    this.isStatsPanelOpen = false;
    this.toggleIsolatedPanel();
  }
}
