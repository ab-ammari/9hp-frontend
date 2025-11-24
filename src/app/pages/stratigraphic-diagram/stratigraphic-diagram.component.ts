import {Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Inject} from '@angular/core';
import { WorkerService } from '../../services/worker.service';
import { StratigraphicDiagramService, DiagramConfig } from '../../services/stratigraphic-diagram.service';
import { ApiStratigraphie } from '../../../../shared';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import panzoom from 'panzoom';
import {DOCUMENT} from "@angular/common";

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
    // S'abonner aux changements de données
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
    // Il sera initialisé après le premier rendu du diagramme
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
        // Réinitialiser le panzoom après le changement de taille
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
  }

  onControlPanelClosed(): void {
    this.isControlPanelOpen = false;
  }

  toggleStatsPanel(): void {
    this.isStatsPanelOpen = !this.isStatsPanelOpen;
    if (this.isStatsPanelOpen) {
      this.isControlPanelOpen = false;
    }
  }

  onStatsPanelClosed(): void {
    this.isStatsPanelOpen = false;
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

      this.currentMermaidCode = this.diagramService.generateMermaidCode(relations, config);
      this.calculateStats(relations);
      await this.renderDiagram();

      // IMPORTANT : Attendre que le SVG soit bien dans le DOM avant d'initialiser panzoom
      setTimeout(() => {
        this.disposePanZoom(); // Supprimer l'ancienne instance si elle existe
        this.initializePanZoom(); // Créer une nouvelle instance
        this.centerDiagram(); // Centrer le diagramme
      }, 300);

      // Fermer le panneau de contrôle après génération réussie
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

    // Chercher le SVG dans le conteneur
    const element = this.diagramContainer.nativeElement.querySelector('svg');

    if (!element) {
      console.warn('SVG element not found for panzoom');
      return;
    }

    // S'assurer qu'il n'y a pas déjà une instance
    if (this.panzoomInstance) {
      this.disposePanZoom();
    }

    // Créer une nouvelle instance de panzoom
    this.panzoomInstance = panzoom(element, {
      maxZoom: 5,
      minZoom: 0.1,
      bounds: true,
      boundsPadding: 0.1,
      zoomDoubleClickSpeed: 1,
      smoothScroll: false,
      // Configuration importante pour le pan
      filterKey: () => true, // Permettre le pan sans touche de modification
      // Enlever les restrictions beforeWheel et beforeMouseDown
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
      // Obtenir les dimensions du conteneur et du SVG
      const container = this.diagramContainer.nativeElement;
      const svg = container.querySelector('svg');

      if (svg) {
        const containerRect = container.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        // Calculer le zoom pour que le SVG soit visible en entier
        const scaleX = containerRect.width / svgRect.width;
        const scaleY = containerRect.height / svgRect.height;
        const scale = Math.min(scaleX, scaleY, 1) * 0.9; // 0.9 pour laisser un peu de marge

        // Réinitialiser puis appliquer le zoom
        this.panzoomInstance.moveTo(0, 0);
        this.panzoomInstance.zoomAbs(0, 0, scale);

        // Centrer le diagramme
        const transform = this.panzoomInstance.getTransform();
        const offsetX = (containerRect.width - svgRect.width * scale) / 2;
        const offsetY = (containerRect.height - svgRect.height * scale) / 2;
        this.panzoomInstance.moveTo(offsetX, offsetY);
      } else {
        // Fallback si pas de SVG
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
