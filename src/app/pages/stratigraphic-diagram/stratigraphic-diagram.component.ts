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
    highlightCycles: false
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
    setTimeout(() => {
      if (this.diagramContainer) {
        this.initializePanZoom();
      }
    }, 100);
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
    // Optionnel : Recentrer le diagramme après le changement de taille
    setTimeout(() => {
      if (this.panzoomInstance) {
        // On peut vouloir ajuster le zoom ici si nécessaire
      }
    }, 100);
  }

  // 7. Implémentation de la fonction toggleFullscreen
  toggleFullscreen(): void {
    if (!this.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  private enterFullscreen(): void {
    // On cible l'élément parent qui contient le diagramme ET les contrôles
    // nativeElement est le div#diagram-container, on veut son parent (section.diagram-display)
    // ou son grand-parent (main.diagram-fullscreen)
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
    this.isStatsPanelOpen = false; // Fermer l'autre panneau
  }

  onControlPanelClosed(): void {
    this.isControlPanelOpen = false;
  }

  toggleStatsPanel(): void {
    this.isStatsPanelOpen = !this.isStatsPanelOpen;
    if (this.isStatsPanelOpen) {
      this.isControlPanelOpen = false; // Fermer l'autre panneau
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

      setTimeout(() => {
        this.resetPanZoom();
      }, 200);

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

  private initializePanZoom(): void {
    if (!this.diagramContainer) return;

    const element = this.diagramContainer.nativeElement.querySelector('svg');

    if (element && !this.panzoomInstance) {
      this.panzoomInstance = panzoom(element, {
        maxZoom: 5,
        minZoom: 0.1,
        bounds: true,
        boundsPadding: 0.1
      });
    }
  }

  resetPanZoom(): void {
    if (this.panzoomInstance) {
      this.panzoomInstance.moveTo(0, 0);
      this.panzoomInstance.zoomAbs(0, 0, 1);
    }
  }

  zoomIn(): void {
    if (this.panzoomInstance) {
      this.panzoomInstance.smoothZoom(0, 0, 1.2);
    }
  }

  zoomOut(): void {
    if (this.panzoomInstance) {
      this.panzoomInstance.smoothZoom(0, 0, 0.8);
    }
  }

  centerDiagram(): void {
    this.resetPanZoom();
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
}
