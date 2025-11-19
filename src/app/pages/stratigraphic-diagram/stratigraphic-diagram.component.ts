import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { WorkerService } from '../../services/worker.service';
import { StratigraphicDiagramService, DiagramConfig } from '../../services/stratigraphic-diagram.service';
import { ApiStratigraphie } from '../../../../shared';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import panzoom from 'panzoom';

@Component({
  selector: 'app-stratigraphic-diagram',
  templateUrl: './stratigraphic-diagram.component.html',
  styleUrls: ['./stratigraphic-diagram.component.scss']
})
export class StratigraphicDiagramComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('diagramContainer', { static: false }) diagramContainer!: ElementRef;

  private destroyer$ = new Subject<void>();
  private panzoomInstance: any;

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

  constructor(
    public w: WorkerService,
    private diagramService: StratigraphicDiagramService
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
  }

  ngAfterViewInit(): void {
    // Initialiser pan/zoom après le rendu
    // Attendre que le ViewChild soit disponible
    setTimeout(() => {
      if (this.diagramContainer) {
        this.initializePanZoom();
      }
    }, 100);
  }

  /**
   * Vérifie si le conteneur est disponible
   */
  private isContainerReady(): boolean {
    return !!(this.diagramContainer && this.diagramContainer.nativeElement);
  }

  ngOnDestroy(): void {
    this.destroyer$.next();
    this.destroyer$.complete();

    if (this.panzoomInstance) {
      this.panzoomInstance.dispose();
    }
  }

  /**
   * Génère le diagramme stratigraphique
   */
  async generateDiagram(): Promise<void> {
    this.isGenerating = true;
    this.errorMessage = '';

    try {
      // Vérifier que le conteneur est disponible
      if (!this.isContainerReady()) {
        // Attendre un peu que le DOM soit prêt
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!this.isContainerReady()) {
          this.errorMessage = 'Le conteneur du diagramme n\'est pas encore prêt. Veuillez réessayer.';
          console.error('Container not ready:', this.diagramContainer);
          return;
        }
      }

      // Récupérer toutes les relations actives
      const relations = this.w.data().objects.stratigraphie.all.list
        .map(item => item.item)
        .filter(rel => rel && rel.live !== false);

      if (relations.length === 0) {
        this.errorMessage = 'Aucune relation stratigraphique disponible';
        return;
      }

      // Appliquer les filtres
      const config: DiagramConfig = {
        ...this.diagramConfig,
        maxDepth: this.filterOptions.maxDepth || undefined,
        focusNode: this.filterOptions.focusNodeUuid || undefined
      };

      // Générer le code Mermaid
      this.currentMermaidCode = this.diagramService.generateMermaidCode(relations, config);

      // Calculer les statistiques
      this.calculateStats(relations);

      // Rendre le diagramme
      await this.renderDiagram();

      // Réinitialiser le pan/zoom
      setTimeout(() => {
        this.resetPanZoom();
      }, 200);

    } catch (error) {
      console.error('Erreur lors de la génération du diagramme:', error);
      this.errorMessage = 'Erreur lors de la génération du diagramme: ' + (error as Error).message;
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Rend le diagramme dans le conteneur
   */
  private async renderDiagram(): Promise<void> {
    // Le conteneur devrait être disponible maintenant (avec [hidden] au lieu de *ngIf)
    if (!this.diagramContainer || !this.diagramContainer.nativeElement) {
      // Une petite attente au cas où
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!this.diagramContainer || !this.diagramContainer.nativeElement) {
      throw new Error('Conteneur du diagramme non disponible. Vérifiez le template HTML.');
    }

    const container = this.diagramContainer.nativeElement;

    // S'assurer que le conteneur a un ID unique
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

  /**
   * Initialise le pan/zoom sur le diagramme
   */
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

  /**
   * Réinitialise le pan/zoom
   */
  resetPanZoom(): void {
    if (this.panzoomInstance) {
      this.panzoomInstance.moveTo(0, 0);
      this.panzoomInstance.zoomAbs(0, 0, 1);
    }
  }

  /**
   * Zoom avant
   */
  zoomIn(): void {
    if (this.panzoomInstance) {
      this.panzoomInstance.smoothZoom(0, 0, 1.2);
    }
  }

  /**
   * Zoom arrière
   */
  zoomOut(): void {
    if (this.panzoomInstance) {
      this.panzoomInstance.smoothZoom(0, 0, 0.8);
    }
  }

  /**
   * Recentrer le diagramme
   */
  centerDiagram(): void {
    this.resetPanZoom();
  }

  /**
   * Toggle une option de configuration
   */
  toggleConfigOption(option: keyof DiagramConfig): void {
    (this.diagramConfig as any)[option] = !(this.diagramConfig as any)[option];

    if (this.currentMermaidCode) {
      this.generateDiagram();
    }
  }

  /**
   * Applique un filtre de profondeur
   */
  applyDepthFilter(): void {
    if (this.currentMermaidCode) {
      this.generateDiagram();
    }
  }

  /**
   * Sélectionne un nœud de focus
   */
  selectFocusNode(uuid: string): void {
    this.filterOptions.focusNodeUuid = uuid;
    this.generateDiagram();
  }

  /**
   * Efface les filtres
   */
  clearFilters(): void {
    this.filterOptions.maxDepth = null;
    this.filterOptions.focusNodeUuid = null;
    this.generateDiagram();
  }

  /**
   * Exporte en PNG
   */
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

  /**
   * Exporte en PDF
   */
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

  /**
   * Copie le code Mermaid dans le presse-papier
   */
  async copyMermaidCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.currentMermaidCode);
      // Afficher un message de succès
      console.log('Code Mermaid copié dans le presse-papier');
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  }

  /**
   * Calcule les statistiques du diagramme
   */
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

  /**
   * Vérifie si un filtre est actif
   */
  get hasActiveFilters(): boolean {
    return this.filterOptions.maxDepth !== null || this.filterOptions.focusNodeUuid !== null;
  }
}
