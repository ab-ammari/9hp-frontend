import {Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Inject} from '@angular/core';
import { WorkerService } from '../../services/worker.service';
import { StratigraphicDiagramService, DiagramConfig, DiagramNode } from '../../services/stratigraphic-diagram.service';
import {ApiDbTable, ApiStratigraphie} from '../../../../shared';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import panzoom from 'panzoom';
import {DOCUMENT} from "@angular/common";
import {ConfirmationService} from "../../services/confirmation.service";
import {CastorAuthorizationService} from "../../services/castor-authorization-service.service";
import { DiagramEditModeService, EdgeClickEvent } from 'src/app/services/diagram-edit-mode.service';
import { DiagramParadoxModeService } from 'src/app/services/diagram-paradox-mode.service';


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

  isIsolatedPanelOpen = false;
  isolatedFilters = {
    showFaits: true,
    showUS: true
  };

  isolatedEntities: IsolatedEntity[] = [];
  filteredIsolatedEntities: IsolatedEntity[] = [];
  expandedFaits = new Set<string>();
  isolatedSearchQuery = '';
  private isolatedEntitiesLoaded: boolean = false;
  readonly ISOLATED_ITEM_HEIGHT = 52;
  readonly ISOLATED_CHILD_ITEM_HEIGHT = 44;

  isRelationsPanelOpen = false;
  relationsSearchQuery = '';
  allRelations: RelationDisplay[] = [];
  filteredRelations: RelationDisplay[] = [];
  isDeletingRelation = false;
  // Flag pour indiquer si les relations ont déjà été chargées
  private relationsLoaded:  boolean = false;
  // Hauteur d'un item pour le virtual scrolling (en pixels)
  readonly RELATION_ITEM_HEIGHT = 56;

  // Mode édition
  isEditMode:  boolean = false;
  showDeleteConfirmation: boolean = false;
  pendingDeletionEvent: EdgeClickEvent | null = null;
  deleteConfirmationPosition = { x: 0, y: 0 };

  // Mode Paradoxe
  isParadoxMode:  boolean = false;
  isCyclesPanelOpen: boolean = false;
  
  private editModeSubscription:  Subscription | null = null;
  private edgeClickSubscription:  Subscription | null = null;

  private relations: ApiStratigraphie[];

  constructor(
    public w: WorkerService,
    private diagramService: StratigraphicDiagramService,
    @Inject(DOCUMENT) private document: Document,
    private authService: CastorAuthorizationService,
    private confirmationService: ConfirmationService,
    private diagramEditModeService: DiagramEditModeService,
    private diagramParadoxModeService:  DiagramParadoxModeService,
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
    this. diagramParadoxModeService.isParadoxMode$
      .pipe(takeUntil(this.destroyer$))
      .subscribe(isActive => {
        this.isParadoxMode = isActive;
      });
  }

  ngAfterViewInit(): void {
    // Initialiser le service d'édition
    if (this.diagramContainer?. nativeElement) {
      this.diagramEditModeService.initialize(this. diagramContainer.nativeElement);
    }

    // Initialiser le service paradoxe
    if (this.diagramContainer?. nativeElement) {
      this.diagramParadoxModeService.initialize(this.diagramContainer.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.destroyer$.next();
    this.destroyer$.complete();

    if (this.panzoomInstance) {
      this.panzoomInstance.dispose();
    }
    this.document.removeEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
  
    this.editModeSubscription?.unsubscribe();
    this.edgeClickSubscription?.unsubscribe();
    this.diagramEditModeService.destroy();

    this.diagramParadoxModeService.destroy();
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

          this.refreshRelations(); // Recharger les relations après suppression
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
    this.isParadoxMode = this.diagramParadoxModeService. toggleParadoxMode();
    
    // Ouvrir automatiquement le panneau des cycles
    if (this.isParadoxMode) {
      this.isCyclesPanelOpen = true;
    }
  }

  /**
   * Ouvre/ferme le panneau des cycles
   */
  toggleCyclesPanel(): void {
    this.isCyclesPanelOpen = !this.isCyclesPanelOpen;
  }

  /**
   * Callback quand le panneau des cycles est fermé
   */
  onCyclesPanelClosed(): void {
    this.isCyclesPanelOpen = false;
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

    // Calculer les statistiques
    this.calculateStats(this.relations);

    // Mettre à jour les entités isolées
    this.updateIsolatedEntities();

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
    this.diagramParadoxModeService.refreshCaches();
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
      this.isRelationsPanelOpen = false;
      
      // Charger les entités isolées seulement si elles n'ont pas encore été chargées
      if (!this.isolatedEntitiesLoaded) {
        this.updateIsolatedEntities();
      }
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
    
    // Forcer le rechargement car les filtres ont changé
    this.isolatedEntitiesLoaded = false;
    this.updateIsolatedEntities();
  }

  // Méthode pour forcer le rechargement des entités isolées
  refreshIsolatedEntities(): void {
    this.isolatedEntitiesLoaded = false;
    this.updateIsolatedEntities();
  }

  // TrackBy pour optimiser le rendu des entités isolées
  trackByIsolatedEntity(index: number, entity: IsolatedEntity): string {
    return entity.uuid;
  }

  // TrackBy pour les enfants US
  trackByChildUS(index: number, child: IsolatedEntity): string {
    return child.uuid;
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
    const relations = this.w.data().objects.stratigraphie.all. list
      .map(item => item.item)
      .filter(rel => rel && rel.live !== false);

    const connectedUUIDs = new Set<string>();

    relations.forEach(rel => {
      if (rel. us_anterieur) connectedUUIDs.add(rel.us_anterieur);
      if (rel.us_posterieur) connectedUUIDs.add(rel.us_posterieur);
      if (rel.fait_anterieur) connectedUUIDs.add(rel.fait_anterieur);
      if (rel.fait_posterieur) connectedUUIDs.add(rel.fait_posterieur);
    });

    const isolated:  IsolatedEntity[] = [];

    if (this.isolatedFilters.showFaits) {
      this.w.data().objects.fait.all.list.forEach(faitWrapper => {
        const fait = faitWrapper.item;
        if (fait && fait.live !== false && !connectedUUIDs.has(fait.fait_uuid)) {
          const childrenUS:  IsolatedEntity[] = [];

          this.w.data().objects.us.all.list.forEach(usWrapper => {
            const us = usWrapper.item;
            if (us && us.live !== false && us.fait_uuid === fait.fait_uuid) {
              if (! connectedUUIDs.has(us.us_uuid)) {
                childrenUS.push({
                  uuid: us.us_uuid,
                  label: us.tag || us.us_uuid. substring(0, 8),
                  type: 'us'
                });
              }
            }
          });

          isolated.push({
            uuid: fait.fait_uuid,
            label: fait.tag || fait.fait_uuid.substring(0, 8),
            type: 'fait',
            childrenUS:  childrenUS. length > 0 ? childrenUS : undefined
          });
        }
      });
    }

    if (this.isolatedFilters.showUS) {
      this.w.data().objects.us.all.list.forEach(usWrapper => {
        const us = usWrapper.item;
        if (us && us.live !== false && !connectedUUIDs.has(us.us_uuid)) {
          const isInIsolatedFait = isolated.some(
            entity => entity.type === 'fait' &&
              entity.childrenUS?. some(child => child.uuid === us.us_uuid)
          );

          if (!isInIsolatedFait) {
            isolated.push({
              uuid: us.us_uuid,
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
      return a.type === 'fait' ? -1 : 1;
    });

    this.isolatedEntities = isolated;
    this.filterIsolatedEntities();
    this.isolatedEntitiesLoaded = true; // Marquer comme chargé
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

  toggleRelationsPanel(): void {
    this.isRelationsPanelOpen = !this. isRelationsPanelOpen;
    if (this.isRelationsPanelOpen) {
      this.isControlPanelOpen = false;
      this.isStatsPanelOpen = false;
      this.isSearchPanelOpen = false;
      this.isLayoutPanelOpen = false;
      this.isIsolatedPanelOpen = false;
      
      // Charger les relations seulement si elles n'ont pas encore été chargées
      // ou si les données sources ont changé
      if (!this.relationsLoaded) {
        this.loadRelations();
      }
    }
  }

  onRelationsPanelClosed(): void {
    this.isRelationsPanelOpen = false;
    this.relationsSearchQuery = '';
  }

  loadRelations(): void {
    const relations = this.w.data().objects.stratigraphie.all. list
      .map(item => item.item)
      .filter(rel => rel && rel.live !== false);

    this.allRelations = relations. map(rel => ({
      relation: rel,
      leftLabel: '',
      leftType: 'us' as 'us' | 'fait',
      rightLabel: '',
      rightType: 'us' as 'us' | 'fait',
      type: ''
    }));

    this.filteredRelations = [... this.allRelations];
    this.relationsLoaded = true; // Marquer comme chargé
  }

  refreshRelations(): void {
    this.relationsLoaded = false;
    this.loadRelations();
  }


  onRelationsSearchChange(): void {
    if (!this.relationsSearchQuery.trim()) {
      this.filteredRelations = [...this.allRelations];
      return;
    }

    const query = this.relationsSearchQuery.toLowerCase().trim();
    this.filteredRelations = this.allRelations.filter(rel => {
      const relation = rel.relation;

      // Recherche dans les UUIDs et tags des entités
      const searchInEntity = (uuid: string | null, table: ApiDbTable) => {
        if (!uuid) return false;
        const entity = table === ApiDbTable.us
          ? this.w.data().objects.us.all.findByUuid(uuid)
          : this.w.data().objects.fait.all.findByUuid(uuid);
        const tag = entity?.item?.tag || '';
        return tag.toLowerCase().includes(query) || uuid.toLowerCase().includes(query);
      };

      return searchInEntity(relation.us_anterieur, ApiDbTable.us) ||
        searchInEntity(relation.us_posterieur, ApiDbTable.us) ||
        searchInEntity(relation.fait_anterieur, ApiDbTable.fait) ||
        searchInEntity(relation.fait_posterieur, ApiDbTable.fait);
    });
  }

  deleteRelation(relDisplay: RelationDisplay, event?: Event): void {
    if (this.isDeletingRelation) {
      return;
    }

    if (event) {
      event.stopPropagation();
    }

    const relation = relDisplay.relation;

    if (this.authService.canDeleteRelation(relation)) {
      this.confirmationService.showConfirmDialog(
        'Supprimer la relation',
        `Êtes-vous sûr de vouloir supprimer la relation : "${relDisplay.leftLabel} → ${relDisplay.rightLabel}" ?`,
        () => {
          this.isDeletingRelation = true;
          relation.live = false;

          this.w.data().objects.stratigraphie.selected.commit(relation).subscribe(
            () => {
              console.log('Relation supprimée avec succès');
              setTimeout(() => {
                this.loadRelations();
                if (this.currentMermaidCode) {
                  this.generateDiagram();
                }
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

  protected readonly ApiDbTable = ApiDbTable;
}
