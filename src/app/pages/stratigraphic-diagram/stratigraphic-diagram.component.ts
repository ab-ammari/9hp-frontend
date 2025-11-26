import {Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Inject} from '@angular/core';
import { WorkerService } from '../../services/worker.service';
import { StratigraphicDiagramService, DiagramConfig, DiagramNode } from '../../services/stratigraphic-diagram.service';
import { ApiStratigraphie } from '../../../../shared';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import panzoom from 'panzoom';
import {DOCUMENT} from "@angular/common";

export type MermaidLayoutMode = 'default' | 'elk' | 'dagre-d3';

@Component({
  selector: 'app-stratigraphic-diagram',
  templateUrl: './stratigraphic-diagram.component.html',
  styleUrls: ['./stratigraphic-diagram.component.scss']
})
export class StratigraphicDiagramComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('diagramContainer', { static: false }) diagramContainer!: ElementRef;

  private destroyer$ = new Subject<void>();
  private panzoomInstance: any;

  // Gestion des panneaux
  isControlPanelOpen = false;
  isStatsPanelOpen = false;
  isSearchPanelOpen = false;
  isLayoutPanelOpen = false;

  // Configuration du diagramme
  diagramConfig: DiagramConfig = {
    includeUS: true,
    includeFaits: true,
    includeContemporaryRelations: true,
    highlightCycles: true,
    groupContemporaries: true,
  };

  // État
  isGenerating = false;
  isExporting = false;
  currentMermaidCode = '';
  errorMessage = '';

  // Recherche d'entités
  searchQuery = '';
  searchResults: DiagramNode[] = [];
  allNodes: DiagramNode[] = [];

  // Mode de layout Mermaid
  currentLayoutMode: MermaidLayoutMode = 'default';
  layoutModes: { value: MermaidLayoutMode; label: string; description: string }[] = [
    { value: 'default', label: 'Par défaut', description: 'Layout flowchart standard de Mermaid' },
    { value: 'elk', label: 'ELK', description: 'Eclipse Layout Kernel - meilleur pour les grands graphes' },
    { value: 'dagre-d3', label: 'Dagre-D3', description: 'Layout hiérarchique optimisé' }
  ];

  // Statistiques
  stats = {
    totalNodes: 0,
    totalEdges: 0,
    usCount: 0,
    faitCount: 0
  };

  // Options de filtrage
  filterOptions = {
    maxDepth: null as number | null,
    focusNodeUuid: null as string | null
  };

  isFullscreen = false;

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
    // Ne pas initialiser panzoom ici car le SVG n'existe pas encore
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
    if (!this.panzoomInstance || !this.diagramContainer) {
      return;
    }

    const container = this.diagramContainer.nativeElement;
    const svg = container.querySelector('svg');

    if (!svg) {
      return;
    }

    // Trouver l'élément du nœud dans le SVG
    const nodeId = 'node_' + node.uuid.replace(/-/g, '_');
    const nodeElement = svg.querySelector(`[id*="${nodeId}"]`) ||
      svg.querySelector(`g.node[id*="${nodeId}"]`) ||
      this.findNodeByLabel(svg, node.label);

    if (nodeElement) {
      // Obtenir les coordonnées du nœud
      const nodeRect = (nodeElement as Element).getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Calculer la position pour centrer le nœud
      const transform = this.panzoomInstance.getTransform();
      const scale = 1.5; // Zoom légèrement pour mettre en évidence

      // Calculer le décalage pour centrer le nœud
      const targetX = containerRect.width / 2 - (nodeRect.left - containerRect.left + nodeRect.width / 2);
      const targetY = containerRect.height / 2 - (nodeRect.top - containerRect.top + nodeRect.height / 2);

      // Appliquer le zoom et le déplacement
      this.panzoomInstance.zoomAbs(containerRect.width / 2, containerRect.height / 2, scale);

      setTimeout(() => {
        this.panzoomInstance.moveTo(targetX * scale, targetY * scale);
      }, 100);

      // Mettre en surbrillance temporaire
      this.highlightNode(nodeElement as Element);

      // Fermer le panneau de recherche
      this.isSearchPanelOpen = false;
    } else {
      console.warn('Nœud non trouvé dans le SVG:', nodeId);
    }
  }

  private findNodeByLabel(svg: SVGElement, label: string): Element | null {
    // Rechercher par texte du label
    const textElements = svg.querySelectorAll('text');
    for (const textEl of Array.from(textElements)) {
      if (textEl.textContent?.includes(label)) {
        // Remonter au groupe parent du nœud
        return textEl.closest('g.node') || textEl.parentElement;
      }
    }
    return null;
  }

  private highlightNode(nodeElement: Element): void {
    // Ajouter une classe de surbrillance temporaire
    nodeElement.classList.add('highlighted-node');

    // Créer un effet de pulsation
    const originalStyle = (nodeElement as HTMLElement).style.cssText;
    (nodeElement as HTMLElement).style.filter = 'drop-shadow(0 0 10px #4CAF50) drop-shadow(0 0 20px #4CAF50)';
    (nodeElement as HTMLElement).style.transition = 'filter 0.3s ease';

    // Retirer la surbrillance après 3 secondes
    setTimeout(() => {
      (nodeElement as HTMLElement).style.filter = '';
      nodeElement.classList.remove('highlighted-node');
    }, 3000);
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

      // Régénérer le diagramme avec le nouveau layout
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

  selectFocusNode(uuid: string): void {
    this.filterOptions.focusNodeUuid = uuid;
    this.generateDiagram();
  }

  clearFilters(): void {
    this.filterOptions.maxDepth = null;
    this.filterOptions.focusNodeUuid = null;
    this.generateDiagram();
  }

  get hasActiveFilters(): boolean {
    return this.filterOptions.maxDepth !== null || this.filterOptions.focusNodeUuid !== null;
  }

  // === Export ===

  async exportPNG(): Promise<void> {
    this.isExporting = true;
    try {
      const containerId = this.diagramContainer.nativeElement.id || 'diagram-container';
      await this.diagramService.exportToPNG(containerId);
    } catch (error) {
      console.error('Erreur lors de l\'export PNG:', error);
      this.errorMessage = 'Erreur lors de l\'export PNG';
    } finally {
      this.isExporting = false;
    }
  }

  async exportPDF(): Promise<void> {
    this.isExporting = true;
    try {
      const containerId = this.diagramContainer.nativeElement.id || 'diagram-container';
      await this.diagramService.exportToPDF(containerId);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      this.errorMessage = 'Erreur lors de l\'export PDF';
    } finally {
      this.isExporting = false;
    }
  }

  async copyMermaidCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.currentMermaidCode);
      console.log('Code Mermaid copié dans le presse-papier');
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
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
      faitCount: Math.floor(faitCount / 2)
    };
  }

  toggleGroupContemporaries(): void {
    this.diagramConfig.groupContemporaries = !this.diagramConfig.groupContemporaries;
    if (this.currentMermaidCode) {
      this.generateDiagram();
    }
  }
}
