import {Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Inject} from '@angular/core';
import { WorkerService } from '../../services/worker.service';
import { StratigraphicDiagramService, DiagramConfig, DiagramNode, DiagramStyleConfig, DEFAULT_DIAGRAM_STYLES} from '../../services/stratigraphic-diagram/stratigraphic-diagram.service';
import {ApiDbTable, ApiStratigraphie} from '../../../../shared';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import panzoom from 'panzoom';
import {DOCUMENT} from "@angular/common";
import {ConfirmationService} from "../../services/confirmation.service";
import {CastorAuthorizationService} from "../../services/castor-authorization-service.service";
import { DiagramEditModeService, EdgeClickEvent } from 'src/app/services/stratigraphic-diagram/diagram-edit-mode.service';
import { DiagramParadoxVisualizationService } from 'src/app/services/stratigraphic-diagram/diagram-paradox-visualization.service';
import { style } from '@angular/animations';
import { DiagramNodeInteractionService, NodeInteractionEvent } from 'src/app/services/stratigraphic-diagram/diagram-node-interaction.service';
import { DiagramNodePopoverData } from 'src/app/Components/Display/diagram-node-popover/diagram-node-popover.component';

export type MermaidLayoutMode = 'default' | 'elk' | 'dagre-d3';

interface IsolatedEntity {
  uuid: string;
  label: string;
  type: 'us' | 'fait';
  childrenUS?: IsolatedEntity[];
}

interface RelationDisplay {
  relation: ApiStratigraphie;
  leftLabel: string;
  leftType: 'us' | 'fait';
  rightLabel: string;
  rightType: 'us' | 'fait';
  type: string;
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
  isLayoutPanelOpen = false;
  isDataPanelOpen = false;

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

  allNodes: DiagramNode[] = [];

  focusNodeSearchQuery = '';
  focusNodeSearchResults: DiagramNode[] = [];
  showFocusNodeSuggestions = false;

  currentLayoutMode: MermaidLayoutMode = 'elk';
  layoutModes: { value: MermaidLayoutMode; label: string; description: string }[] = [
    { value: 'default', label: 'Layout flowchart', description: 'Layout flowchart standard de Mermaid' },
    { value: 'elk', label: 'ELK (par défaut)', description: 'Eclipse Layout Kernel - meilleur pour les grands graphes' },
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

  isDeletingRelation = false;

  // Mode édition
  isEditMode:  boolean = false;
  showDeleteConfirmation: boolean = false;
  pendingDeletionEvent: EdgeClickEvent | null = null;
  deleteConfirmationPosition = { x: 0, y: 0 };

  // Mode Paradoxe
  isParadoxMode:  boolean = false;
  isParadoxesPanelOpen: boolean = false;
  
  private editModeSubscription:  Subscription | null = null;
  private edgeClickSubscription:  Subscription | null = null;

  private relations: ApiStratigraphie[];

  // legend
  showLegend: boolean = false;
  styleConfig: DiagramStyleConfig = { ...DEFAULT_DIAGRAM_STYLES };

  // === Popover pour les nœuds cliquables ===
  nodePopoverData: DiagramNodePopoverData | null = null;
  isNodePopoverVisible: boolean = false;
  private nodeInteractionSubscriptions: Subscription[] = [];

  constructor(
    public w: WorkerService,
    private diagramService: StratigraphicDiagramService,
    @Inject(DOCUMENT) private document: Document,
    private authService: CastorAuthorizationService,
    private confirmationService: ConfirmationService,
    private diagramEditModeService: DiagramEditModeService,
    private diagramParadoxVisualizationService: DiagramParadoxVisualizationService,
    private diagramNodeInteractionService: DiagramNodeInteractionService
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
  
    // Souscrire aux événements du mode édition
    this.editModeSubscription = this.diagramEditModeService.isEditMode$.subscribe(
      isEdit => this.isEditMode = isEdit
    );

    this.edgeClickSubscription = this.diagramEditModeService.edgeClicked$.subscribe(
      event => this.onEdgeClicked(event)
    );

    // S'abonner au mode paradoxe
    this.diagramParadoxVisualizationService.isParadoxMode$
      .pipe(takeUntil(this.destroyer$))
      .subscribe(isActive => {
        this.isParadoxMode = isActive;
      });

    // load style preferences
    this.loadStylePreferences();
    
    // upload style config from service
    this.styleConfig = this.diagramService.getStyleConfig();

     this.nodeInteractionSubscriptions.push(
      this.diagramNodeInteractionService.nodeClicked$
        .pipe(takeUntil(this.destroyer$))
        .subscribe(event => this.onNodeClicked(event))
    );
    
    this.nodeInteractionSubscriptions.push(
      this.diagramNodeInteractionService.nodeLongPressed$
        .pipe(takeUntil(this.destroyer$))
        .subscribe(event => this.onNodeLongPressed(event))
    );
  }

  ngAfterViewInit(): void {
    // Initialiser le service d'édition
    if (this.diagramContainer?. nativeElement) {
      this.diagramEditModeService.initialize(this. diagramContainer.nativeElement);
    }

    // Initialiser le service paradoxe
    if (this.diagramContainer?.nativeElement) {
      this.diagramParadoxVisualizationService.initialize(this.diagramContainer.nativeElement);
    }

    if (this.diagramContainer?.nativeElement) {
      this.diagramNodeInteractionService.initialize(this.diagramContainer.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.diagramNodeInteractionService.destroy();
    this.nodeInteractionSubscriptions.forEach(sub => sub.unsubscribe());

    this.destroyer$.next();
    this.destroyer$.complete();

    if (this.panzoomInstance) {
      this.panzoomInstance.dispose();
    }
    this.document.removeEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
  
    this.editModeSubscription?.unsubscribe();
    this.edgeClickSubscription?.unsubscribe();
    this.diagramEditModeService.destroy();

    this.diagramParadoxVisualizationService.destroy();

    this.diagramNodeInteractionService.destroy();
    this.nodeInteractionSubscriptions.forEach(sub => sub.unsubscribe());
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

  // ==========================================
  // MÉTHODES DU MODE ÉDITION
  // ==========================================

  /**
   * Toggle le mode édition
   */
  toggleEditMode(): void {
    this.isEditMode = this.diagramEditModeService.toggleEditMode();
    
    if (this.isEditMode) {
      // S'assurer que le cache des relations est à jour
      this. diagramEditModeService.updateRelations(this.relations);
    }
  }

  /**
   * Appelé quand une arête est cliquée en mode édition
   */
  private onEdgeClicked(event: EdgeClickEvent): void {
    console.log('[Component] Edge clicked:', event.resolvedRelation);

    this.pendingDeletionEvent = event;
    
    // Positionner la confirmation près du clic
    this.deleteConfirmationPosition = {
      x: Math.min(event.mouseEvent.clientX + 10, window.innerWidth - 310),
      y: Math.min(event.mouseEvent.clientY, window.innerHeight - 200)
    };
    
    this. showDeleteConfirmation = true;
  }

  /**
 * Confirme la suppression de la relation (appelé depuis le mode édition visuel)
 */
  async confirmDeleteRelation(): Promise<void> {
    if (!this.pendingDeletionEvent) return;

    const { resolvedRelation, edgeElement } = this.pendingDeletionEvent;
    const relation = resolvedRelation.relation;

    console.log('[Component] Deleting relation:', relation. stratigraphie_uuid);

    // Vérifier les permissions d'abord
    if (! this.canDeleteRelation(relation)) {
      this.confirmationService. showInfoDialog(
        'Accès refusé',
        'Seul le propriétaire du projet ou le créateur de cette relation peut la supprimer.'
      );
      this.cancelDeleteConfirmation();
      return;
    }

    // Marquer visuellement
    this.diagramEditModeService.markForDeletion(edgeElement);

    try {
      this.isDeletingRelation = true;

      // Utiliser la même logique que deleteRelation existante
      await this. executeRelationDeletion(relation);

      // Fermer la confirmation
      this.cancelDeleteConfirmation();

      // Régénérer le diagramme
      await this.generateDiagram();

      // Notification de succès (optionnel, selon votre UI)
      console.log('[Component] Relation deleted successfully');

    } catch (error) {
      console.error('[Component] Delete relation error:', error);
      this.errorMessage = 'Erreur lors de la suppression de la relation';
      this.diagramEditModeService.clearAllHighlights();
      
      // Afficher un message d'erreur
      this.confirmationService.showConfirmDialog(
        'Erreur',
        'Une erreur est survenue lors de la suppression de la relation.',
        () => {},
        () => {},
        'OK',
        null
      );
    } finally {
      this.isDeletingRelation = false;
    }
  }

  /**
   * Exécute la suppression de la relation via l'API
   * Réutilise la logique existante mais retourne une Promise
   */
  private executeRelationDeletion(relation: ApiStratigraphie): Promise<void> {
    return new Promise((resolve, reject) => {
      // Marquer la relation comme supprimée (soft delete)
      relation.live = false;

      // Commit la modification
      this.w.data().objects.stratigraphie. selected.commit(relation).subscribe({
        next: () => {
          console.log('[Component] Relation committed successfully');
          
          // Mettre à jour la liste locale des relations
          this. relations = this.relations. filter(
            r => r. stratigraphie_uuid !== relation.stratigraphie_uuid
          );

          //this.refreshRelations(); // Recharger les relations après suppression
          resolve();

          // Attendre un court instant pour la synchronisation
          setTimeout(() => { // Si vous avez cette méthode
            resolve();
          }, 100);
        },
        error:  (error) => {
          console.error('[Component] Commit error:', error);
          // Restaurer l'état en cas d'erreur
          relation.live = true;
          reject(error);
        }
      });
    });
  }

  trackByRelationUuid(index: number, item: RelationDisplay): string {
    return item.relation.stratigraphie_uuid || index.toString();
  }

  /**
   * Vérification des permissions (réutiliser l'existante)
   */
  canDeleteRelation(relation: ApiStratigraphie): boolean {
    return this.authService.canDeleteRelation(relation);
  }

  /**
   * Annule la confirmation de suppression
   */
  cancelDeleteConfirmation(): void {
    this.showDeleteConfirmation = false;
    this.pendingDeletionEvent = null;
    this.diagramEditModeService.clearAllHighlights();
  }

  /**
   * Récupère le label d'une entité (US ou Fait) par son UUID
   */
  getEntityLabel(uuid: string, type: 'us' | 'fait'): string {
    if (type === 'us') {
      const us = this.w.data().objects. us. all. findByUuid(uuid);
      return us?. item. tag || uuid. substring(0, 8);
    } else {
      const fait = this.w.data().objects.fait.all.findByUuid(uuid);
      return fait?.item.tag || uuid. substring(0, 8);
    }
  }

  // ==========================================
  // MÉTHODES DU MODE PARADOXE
  // ==========================================

  /**
   * Toggle le mode paradoxe
   */
  toggleParadoxMode(): void {
    this.isParadoxMode = this.diagramParadoxVisualizationService.toggleParadoxMode();
    
    // Ajouter/retirer la classe sur le SVG
    if (this.diagramContainer?.nativeElement) {
      const svg = this.diagramContainer.nativeElement.querySelector('svg');
      if (svg) {
        if (this.isParadoxMode) {
          svg.classList.add('paradox-mode-active');
        } else {
          svg.classList.remove('paradox-mode-active');
        }
      }
    }
    
    // Ouvrir automatiquement le panneau des paradoxes
    if (this.isParadoxMode) {
      this.isParadoxesPanelOpen = true;
    }
  }

  /**
   * Ouvre/ferme le panneau des cycles
   */
  toggleCyclesPanel(): void {
    this.isParadoxesPanelOpen = !this.isParadoxesPanelOpen;
  }

  /**
   * Callback quand le panneau des cycles est fermé
   */
  onParadoxesPanelClosed(): void {
    this.isParadoxesPanelOpen = false;
  }

  // === Gestion des panneaux ===

  openControlPanel(): void {
    this.isControlPanelOpen = true;
    this.isDataPanelOpen = false;
  }

  onControlPanelClosed(): void {
    this.isControlPanelOpen = false;
  }

  // === Recherche d'entités ===

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

  selectLayoutMode(mode: MermaidLayoutMode): void {
    if (this.currentLayoutMode !== mode) {
      this.currentLayoutMode = mode;
      this.diagramService.setLayoutMode(mode);

      if (this.currentMermaidCode) {
        this.generateDiagram();
      }
    }
  }

  // === Génération du diagramme ===

  /**
 * Génère le diagramme stratigraphique
 */
async generateDiagram(): Promise<void> {
  // Éviter les générations multiples simultanées
  if (this.isGenerating) {
    console.log('[Component] Generation already in progress, skipping');
    return;
  }

  this.isGenerating = true;
  this.errorMessage = '';

  try {
    console.log('[Component] Starting diagram generation...');

    // Récupérer les relations depuis le service/API
    // Adapter selon votre implémentation existante
    if (! this.relations || this.relations.length === 0) {
      this.relations = this.w.data().objects.stratigraphie.all.list
        .filter(wrapper => wrapper.item.live)
        .map(wrapper => wrapper.item);
    }

    console.log(`[Component] Found ${this.relations.length} relations`);

    // Vérifier qu'il y a des relations à afficher
    if (this.relations.length === 0) {
      this.currentMermaidCode = '';
      this.allNodes = [];
      this.isGenerating = false;
      return;
    }

    // Générer le code Mermaid avec les nœuds
    const result = this.diagramService.generateMermaidCodeWithNodes(
      this.relations,
      this.diagramConfig
    );

    this.currentMermaidCode = result.code;
    this.allNodes = result.nodes;

    console.log('[Component] Mermaid code generated');
    console.log('[Component] Nodes count:', this.allNodes.length);

    // Vérifier que le conteneur est prêt
    if (! this.isContainerReady()) {
      console.warn('[Component] Container not ready, waiting...');
      await this.waitForContainer();
    }

    // Rendre le diagramme
    await this.renderDiagram();

    console.log('[Component] Diagram rendered successfully');

    // Rafraîchir les listeners d'interaction sur les nœuds
    setTimeout(() => {
      this.diagramNodeInteractionService.refresh();
    }, 200);
    
    setTimeout(() => {
      this.applyStylesWithoutRegeneration();
    }, 100);

    // Calculer les statistiques
    this.calculateStats(this.relations);

    // Mettre à jour les entités isolées
    // this.updateIsolatedEntities();

    // === MODE ÉDITION :  Mise à jour des caches ===
    
    // Mettre à jour le cache des relations pour le mode édition
    this.diagramEditModeService.updateRelations(this.relations);

    // Si le mode édition était actif, le réactiver après le rendu
    if (this.isEditMode) {
      console.log('[Component] Re-enabling edit mode after diagram regeneration');
      
      // Petit délai pour s'assurer que le DOM est complètement prêt
      setTimeout(() => {
        // Désactiver puis réactiver pour réattacher les listeners
        this.diagramEditModeService.setEditMode(false);
        this.diagramEditModeService.setEditMode(true);
      }, 150);
    }

    // Initialiser le pan/zoom si nécessaire
    this.initializePanZoom();

    this.isControlPanelOpen = false;

  } catch (error) {
    console. error('[Component] Error generating diagram:', error);
    this.errorMessage = 'Erreur lors de la génération du diagramme.  Veuillez réessayer.';
    
    // Afficher plus de détails en mode développement
    if (error instanceof Error) {
      console.error('[Component] Error details:', error. message);
      console.error('[Component] Stack trace:', error.stack);
    }
  } finally {
    this.isGenerating = false;
  }
}

  private isContainerReady(): boolean {
    return !!(this.diagramContainer && this.diagramContainer.nativeElement);
  }

  /**
   * Attend que le conteneur soit disponible
   */
  private waitForContainer(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.isContainerReady()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      // Timeout après 2 secondes
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 2000);
    });
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

    // Rafraîchir les caches du service paradoxe
    setTimeout(() => {
    // Debug structure (à retirer après avoir résolu le problème)
    this.debugSVGStructure();
    
    // Rafraîchir les caches du service paradoxe
    this.diagramParadoxVisualizationService.refreshCaches();
  }, 500);
  }

  /**
 * Debug: Inspecte le SVG pour comprendre la structure
 */
private debugSVGStructure(): void {
  if (this.diagramContainer?.nativeElement) {
    const svg = this.diagramContainer.nativeElement.querySelector('svg');
    if (svg) {
      console.log('[DEBUG] SVG Structure Analysis:');
      
      // Analyser les nœuds
      const nodes = svg.querySelectorAll('.node');
      console.log(`Found ${nodes.length} nodes`);
      if (nodes.length > 0) {
        console.log('Sample node:', nodes[0]);
        console.log('Node ID:', nodes[0].id);
      }
      
      // Analyser les arêtes
      const paths = svg.querySelectorAll('path.flowchart-link');
      console.log(`Found ${paths.length} flowchart-link paths`);
      if (paths.length > 0) {
        console.log('Sample path classes:', paths[0].className.baseVal || paths[0].className);
        
        // Afficher les premières arêtes pour voir le format des classes
        for (let i = 0; i < Math.min(5, paths.length); i++) {
          const classes = paths[i].className.baseVal || paths[i].className;
          console.log(`Path ${i} classes:`, classes);
        }
      }
    }
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
      maxZoom: 15,
      minZoom: 0.05,
      bounds: false,
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

  /**
   * toggle display of the legend
   */
  toggleLegend(): void {
    this.showLegend = !this.showLegend;
  }

  /**
   * gerat th changment of a style property
   * @param property - the property to change
   * @param event - the event of input color picker
   */
  onStyleChange(property: keyof DiagramStyleConfig, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // update the local configuration
    this.styleConfig = {
      ...this.styleConfig,
      [property]: value
    };
    
    // update the service
    this.diagramService.setStyleConfig({ [property]: value });
    
    // generat the diagram to apply the new styles
    if (this.currentMermaidCode) {
      this.applyStylesWithoutRegeneration();
    }

    // save preferences
    this.saveStylePreferences();
  }

  /**
   * apply styles without regenerating the diagram
   * (more efficient for color changes in real-time)
   */
  private applyStylesWithoutRegeneration(): void {
    if (!this.diagramContainer?.nativeElement) return;
    
    const svg = this.diagramContainer.nativeElement.querySelector('svg');
    if (!svg) return;

    // apply styles to Fait subgraphs
    const faitSubgraphs = svg.querySelectorAll('g.subgraph.fait-subgraph rect.subgraph');
    faitSubgraphs.forEach((rect: Element) => {
      (rect as SVGRectElement).style.fill = this.styleConfig.faitBackground;
      (rect as SVGRectElement).style.stroke = this.styleConfig.faitStroke;
    });

    // apply styles to Contemporary Group subgraphs
    const contemporarySubgraphs = svg.querySelectorAll('g.subgraph.contemporary-group rect.subgraph');
    contemporarySubgraphs.forEach((rect: Element) => {
      (rect as SVGRectElement).style.fill = this.styleConfig.contemporaryGroupBackground;
      (rect as SVGRectElement).style.stroke = this.styleConfig.contemporaryGroupStroke;
    });

    // apply styles to US nodes
    const usNodes = svg.querySelectorAll('g.node.usStyle');
    usNodes.forEach((node: Element) => {
      const shapes = node.querySelectorAll('rect, polygon, circle, ellipse');
      shapes.forEach((shape: Element) => {
        (shape as SVGElement).style.setProperty('fill', this.styleConfig.usBackground, 'important');
        (shape as SVGElement).style.setProperty('stroke', this.styleConfig.usStroke, 'important');
      });
    });

    // apply styles to Fait nodes
    const faitNodes = svg.querySelectorAll('g.node.faitStyle');
    faitNodes.forEach((node: Element) => {
      const shapes = node.querySelectorAll('rect, polygon, circle, ellipse');
      shapes.forEach((shape: Element) => {
        (shape as SVGElement).style.fill = this.styleConfig.faitBackground;
        (shape as SVGElement).style.stroke = this.styleConfig.faitStroke;
      });
    });

    // update css variables for other components
    this.updateCssVariables();
  }

  /**
   * update CSS variables for visual consistency
   */
  private updateCssVariables(): void {
    const host = this.diagramContainer?.nativeElement?.closest('.stratigraphic-diagram-page');
    if (host) {
      host.style.setProperty('--diagram-us-bg', this.styleConfig.usBackground);
      host.style.setProperty('--diagram-us-stroke', this.styleConfig.usStroke);
      host.style.setProperty('--diagram-fait-bg', this.styleConfig.faitBackground);
      host.style.setProperty('--diagram-fait-stroke', this.styleConfig.faitStroke);
      host.style.setProperty('--diagram-contemporary-bg', this.styleConfig.contemporaryGroupBackground);
      host.style.setProperty('--diagram-contemporary-stroke', this.styleConfig.contemporaryGroupStroke);
    }
  }

  /**
   * Reset styles to default values
   * 
   */
  resetStyles(): void {
    // Reset local configuration
    this.styleConfig = { ...DEFAULT_DIAGRAM_STYLES };
    
    // reset the service
    this.diagramService.resetStyleConfig();
    
    // apply styles
    if (this.currentMermaidCode) {
      this.applyStylesWithoutRegeneration();
    }

    // save preferences
    this.saveStylePreferences();
  }

  // =============================================
  // save preferences to local storage
  // =============================================

  /**
   * Save style preferences to local storage
   */
  private saveStylePreferences(): void {
    try {
      localStorage.setItem('diagram-style-config', JSON.stringify(this.styleConfig));
    } catch (e) {
      console.warn('unable to save style preferences to local storage:', e);
    }
  }

  /**
   * upload style preferences from local storage
   */
  private loadStylePreferences(): void {
    try {
      const saved = localStorage.getItem('diagram-style-config');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<DiagramStyleConfig>;
        this.styleConfig = { ...this.styleConfig, ...parsed };
        this.diagramService.setStyleConfig(this.styleConfig);
      }
    } catch (e) {
      console.warn('unable to load style preferences from local storage:', e);
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

  /**
   * Récupère le label d'un nœud à partir de son ID sanitizé
   */
  getNodeLabel(sanitizedId: string): string {
    // Convertir l'ID sanitizé en UUID
    const uuid = sanitizedId.replace('node_', '').replace(/_/g, '-');
    
    // Chercher dans les nœuds
    const node = this.allNodes.find(n => n. uuid === uuid);
    return node?. label || sanitizedId;
  }

  /**
   * Toggle le panneau de données unifié
   */
  toggleDataPanel(): void {
    this.isDataPanelOpen = !this.isDataPanelOpen;
    if (this.isDataPanelOpen) {
      this.isControlPanelOpen = false;
      this.isParadoxesPanelOpen = false;
    }
  }

  /**
   * Callback quand le panneau de données est fermé
   */
  onDataPanelClosed(): void {
    this.isDataPanelOpen = false;
  }

  /**
   * Appelé quand un nœud est cliqué
   */
  private onNodeClicked(event: NodeInteractionEvent): void {
    console.log('[Component] Node clicked:', event);
    
    // Si le mode édition est actif, ne pas afficher le popover
    if (this.isEditMode) {
      return;
    }
    
    this.showNodePopover(event);
  }
  
  /**
   * Appelé quand un nœud est "long pressed" (mobile)
   */
  private onNodeLongPressed(event: NodeInteractionEvent): void {
    console.log('[Component] Node long pressed:', event);
    
    // Le long press affiche toujours le popover, même en mode édition
    this.showNodePopover(event);
  }
  
  /**
   * Affiche le popover pour un nœud
   */
  private showNodePopover(event: NodeInteractionEvent): void {
    console.log('Show popover at position:', event.position); // Debug
    
    this.nodePopoverData = {
      uuid: event.uuid,
      type: event.type,
      label: event.label,
      object: event.object,
      position: event.position  // Doit contenir { x: number, y: number }
    };
    this.isNodePopoverVisible = true;
  }
  
  /**
   * Ferme le popover des nœuds
   */
  closeNodePopover(): void {
    this.isNodePopoverVisible = false;
    this.nodePopoverData = null;
  }
  
  /**
   * Appelé quand la navigation est déclenchée depuis le popover
   */
  onNodeNavigated(event: { object: any; newTab: boolean }): void {
    console.log('[Component] Node navigated:', event);
    this.closeNodePopover();
  }

  protected readonly ApiDbTable = ApiDbTable;
}
