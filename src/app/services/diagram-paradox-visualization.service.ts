import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { CastorValidationService, DetectedParadox, CycleParadox } from './castor-validation.service';
import { WorkerService } from './worker.service';
import { ApiStratigraphie } from '../../../shared';
import { 
  ParadoxHighlight, 
  ParadoxHighlighter 
} from './paradox-highlighters/paradox-highlighter.base';
import { CycleHighlighter } from './paradox-highlighters/cycle-highlighter';
import { TemporalHighlighter } from './paradox-highlighters/temporal-highlighter';
import { ConsistencyHighlighter } from './paradox-highlighters/consistency-highlighter';
import { ContainmentHighlighter } from './paradox-highlighters/containment-highlighter';

export type ParadoxType = 'all' | 'cycle' | 'temporal' | 'consistency' | 'containment';

export interface ParadoxNavigationState {
  activeType: ParadoxType;
  currentIndexByType: Map<ParadoxType, number>;
  totalByType: Map<ParadoxType, number>;
  currentParadox: ParadoxHighlight | null;
  selectedParadoxIds: Set<string>;
}

@Injectable({
  providedIn: 'root'
})
export class DiagramParadoxVisualizationService {
  
  // États observables (garder existant)
  private _isParadoxMode = new BehaviorSubject<boolean>(false);
  public isParadoxMode$ = this._isParadoxMode.asObservable();
  
  private _activeParadoxType = new BehaviorSubject<ParadoxType>('all');
  public activeParadoxType$ = this._activeParadoxType.asObservable();
  
  private _detectedParadoxes = new BehaviorSubject<ParadoxHighlight[]>([]);
  public detectedParadoxes$ = this._detectedParadoxes.asObservable();
  
  private _navigationState = new BehaviorSubject<ParadoxNavigationState>({
    activeType: 'all',
    currentIndexByType: new Map(),
    totalByType: new Map(),
    currentParadox: null,
    selectedParadoxIds: new Set()
  });
  public navigationState$ = this._navigationState.asObservable();
  
  // Caches et mappings
  private paradoxesByType = new Map<ParadoxType, ParadoxHighlight[]>();
  private allParadoxes: ParadoxHighlight[] = [];
  private paradoxesById = new Map<string, ParadoxHighlight>();
  
  // Palette de couleurs cohérente
  private colorPalette = [
    '#e91e63',  // Rose
    '#9c27b0',  // Violet
    '#673ab7',  // Violet foncé
    '#3f51b5',  // Indigo
    '#f44336',  // Rouge
    '#ff5722',  // Orange foncé
    '#ff9800',  // Orange
    '#4caf50',  // Vert
    '#00bcd4',  // Cyan
    '#2196f3',  // Bleu
  ];
  
  // Highlighters
  private highlighters = new Map<string, ParadoxHighlighter>([
    ['cycle', new CycleHighlighter()],
    ['temporal', new TemporalHighlighter()],
    ['consistency', new ConsistencyHighlighter()],
    ['containment', new ContainmentHighlighter()]
  ]);
  
  // Référence au conteneur
  private containerElement: HTMLElement | null = null;
  
  constructor(
    private validationService: CastorValidationService,
    private workerService: WorkerService
  ) {}
  
  /**
   * Initialise le service avec le conteneur du diagramme
   */
  initialize(container: HTMLElement): void {
    this.containerElement = container;
    console.log('[ParadoxVisualization] Service initialized');
  }
  
  /**
   * Active/désactive le mode paradoxe
   */
  toggleParadoxMode(): boolean {
    const newState = !this._isParadoxMode.value;
    this.setParadoxMode(newState);
    
    if (newState) {
      this.detectAllParadoxes();
    } else {
      this.clearAllHighlights();
    }
    
    return newState;
  }
  
  setParadoxMode(enabled: boolean): void {
    this._isParadoxMode.next(enabled);
    
    if (!enabled) {
      this.clearAllHighlights();
    }
  }
  
  /**
   * Change le type de paradoxe actif
   */
  setActiveParadoxType(type: ParadoxType): void {
    this._activeParadoxType.next(type);
    
    const state = this._navigationState.value;
    state.activeType = type;
    
    const paradoxesForType = this.getParadoxesByType(type);
    if (paradoxesForType.length > 0 && !state.currentIndexByType.has(type)) {
      state.currentIndexByType.set(type, 0);
      state.currentParadox = paradoxesForType[0];
    }
    
    this._navigationState.next(state);
    this.applyHighlights();
  }
  
  /**
   * Détecte tous les paradoxes
   */
  detectAllParadoxes(): void {
    console.log('[ParadoxVisualization] Detecting all paradoxes...');
    
    const detectedParadoxes = this.validationService.findAllParadoxes();
    console.log(`[ParadoxVisualization] Found ${detectedParadoxes.length} paradoxes`);
    
    this.allParadoxes = [];
    this.paradoxesByType.clear();
    this.paradoxesById.clear();
    
    // Initialiser les listes par type
    this.paradoxesByType.set('all', []);
    this.paradoxesByType.set('cycle', []);
    this.paradoxesByType.set('temporal', []);
    this.paradoxesByType.set('consistency', []);
    this.paradoxesByType.set('containment', []);
    
    // Grouper et convertir les paradoxes
    const paradoxesByTypeTemp = new Map<string, DetectedParadox[]>();
    detectedParadoxes.forEach(paradox => {
      if (!paradoxesByTypeTemp.has(paradox.type)) {
        paradoxesByTypeTemp.set(paradox.type, []);
      }
      paradoxesByTypeTemp.get(paradox.type)!.push(paradox);
    });
    
    // Convertir avec les highlighters et assigner des couleurs cohérentes
    let globalColorIndex = 0;
    paradoxesByTypeTemp.forEach((paradoxes, type) => {
      const highlighter = this.highlighters.get(type);
      if (highlighter) {
        paradoxes.forEach((paradox, index) => {
          const highlight = highlighter.buildHighlight(paradox, globalColorIndex++);
          this.allParadoxes.push(highlight);
          this.paradoxesById.set(highlight.paradoxId, highlight);
          this.paradoxesByType.get(type as ParadoxType)!.push(highlight);
          this.paradoxesByType.get('all')!.push(highlight);
        });
      }
    });
    
    // Mettre à jour l'état de navigation
    const state = this._navigationState.value;
    state.totalByType.clear();
    this.paradoxesByType.forEach((paradoxes, type) => {
      state.totalByType.set(type, paradoxes.length);
    });
    
    // Sélectionner le premier paradoxe du type actif si disponible
    const activeTypeParadoxes = this.getParadoxesByType(state.activeType);
    if (activeTypeParadoxes.length > 0) {
      state.currentIndexByType.set(state.activeType, 0);
      state.currentParadox = activeTypeParadoxes[0];
      state.selectedParadoxIds = new Set([activeTypeParadoxes[0].paradoxId]);
    }
    
    this._navigationState.next(state);
    this._detectedParadoxes.next(this.allParadoxes);
    
    // Appliquer les highlights visuels
    this.applyHighlights();
  }
  
  /**
   * Retourne les paradoxes du type spécifié
   */
  getParadoxesByType(type: ParadoxType): ParadoxHighlight[] {
    return this.paradoxesByType.get(type) || [];
  }
  
  /**
   * Obtient la couleur d'un paradoxe
   */
  getParadoxColor(paradox: ParadoxHighlight): string {
    return this.colorPalette[paradox.colorIndex % this.colorPalette.length];
  }
  
  /**
   * Navigation entre paradoxes
   */
  nextParadox(): void {
    const state = this._navigationState.value;
    const paradoxes = this.getParadoxesByType(state.activeType);
    
    if (paradoxes.length === 0) return;
    
    const currentIndex = state.currentIndexByType.get(state.activeType) || 0;
    const nextIndex = (currentIndex + 1) % paradoxes.length;
    
    state.currentIndexByType.set(state.activeType, nextIndex);
    state.currentParadox = paradoxes[nextIndex];
    state.selectedParadoxIds = new Set([paradoxes[nextIndex].paradoxId]);
    
    this._navigationState.next(state);
    this.applyHighlights();
  }
  
  previousParadox(): void {
    const state = this._navigationState.value;
    const paradoxes = this.getParadoxesByType(state.activeType);
    
    if (paradoxes.length === 0) return;
    
    const currentIndex = state.currentIndexByType.get(state.activeType) || 0;
    const prevIndex = currentIndex === 0 ? paradoxes.length - 1 : currentIndex - 1;
    
    state.currentIndexByType.set(state.activeType, prevIndex);
    state.currentParadox = paradoxes[prevIndex];
    state.selectedParadoxIds = new Set([paradoxes[prevIndex].paradoxId]);
    
    this._navigationState.next(state);
    this.applyHighlights();
  }
  
  selectParadoxByIndex(index: number): void {
    const state = this._navigationState.value;
    const paradoxes = this.getParadoxesByType(state.activeType);
    
    if (index >= 0 && index < paradoxes.length) {
      state.currentIndexByType.set(state.activeType, index);
      state.currentParadox = paradoxes[index];
      state.selectedParadoxIds = new Set([paradoxes[index].paradoxId]);
      
      this._navigationState.next(state);
      this.applyHighlights();
    }
  }
  
  toggleParadoxSelection(paradoxId: string): void {
    const state = this._navigationState.value;
    
    if (state.selectedParadoxIds.has(paradoxId)) {
      state.selectedParadoxIds.delete(paradoxId);
    } else {
      state.selectedParadoxIds.add(paradoxId);
    }
    
    this._navigationState.next(state);
    this.applyHighlights();
  }
  
  selectAllParadoxes(): void {
    const state = this._navigationState.value;
    const paradoxes = this.getParadoxesByType(state.activeType);
    
    state.selectedParadoxIds = new Set(paradoxes.map(p => p.paradoxId));
    
    this._navigationState.next(state);
    this.applyHighlights();
  }
  
  deselectAllParadoxes(): void {
    const state = this._navigationState.value;
    state.selectedParadoxIds.clear();
    
    this._navigationState.next(state);
    this.applyHighlights();
  }
  
  isParadoxSelected(paradoxId: string): boolean {
    return this._navigationState.value.selectedParadoxIds.has(paradoxId);
  }
  
  /**
   * Application des highlights visuels - Méthode principale
   */
  private applyHighlights(): void {
    if (!this.containerElement) {
      console.warn('[ParadoxVisualization] No container element');
      return;
    }
    
    this.clearAllHighlights();
    
    const state = this._navigationState.value;
    const selectedParadoxes = Array.from(state.selectedParadoxIds)
      .map(id => this.paradoxesById.get(id))
      .filter(p => p !== undefined) as ParadoxHighlight[];
    
    console.log(`[ParadoxVisualization] Applying highlights for ${selectedParadoxes.length} paradoxes`);
    
    // Appliquer les highlights pour chaque paradoxe
    selectedParadoxes.forEach(paradox => {
      this.applyParadoxHighlight(paradox);
    });
  }
  
  /**
   * Application du highlight pour un paradoxe spécifique
   */
  private applyParadoxHighlight(paradox: ParadoxHighlight): void {
    if (!this.containerElement) return;
    
    const svg = this.containerElement.querySelector('svg');
    if (!svg) {
      console.warn('[ParadoxVisualization] No SVG found');
      return;
    }
    
    const color = this.getParadoxColor(paradox);
    console.log(`[ParadoxVisualization] Highlighting ${paradox.type} paradox ${paradox.paradoxId} with color ${color}`);
    
    switch (paradox.type) {
      case 'cycle':
        this.highlightCycleParadox(svg, paradox, color);
        break;
      case 'temporal':
        this.highlightTemporalParadox(svg, paradox, color);
        break;
      case 'consistency':
        this.highlightConsistencyParadox(svg, paradox, color);
        break;
      case 'containment':
        this.highlightContainmentParadox(svg, paradox, color);
        break;
    }
  }
  
  /**
   * Highlight spécifique pour les cycles
   */
  private highlightCycleParadox(svg: Element, paradox: ParadoxHighlight, color: string): void {
    const cycleUUIDs = paradox.metadata?.cycleNodesUUIDs;
    if (!cycleUUIDs || cycleUUIDs.length < 2) return;
    
    console.log(`[Cycle] Highlighting cycle with ${cycleUUIDs.length} nodes`);
    
    // Mettre en évidence les arêtes du cycle
    for (let i = 0; i < cycleUUIDs.length; i++) {
      const sourceUUID = cycleUUIDs[i];
      const targetUUID = cycleUUIDs[(i + 1) % cycleUUIDs.length];
      
      const edge = this.findEdgeByUUIDs(svg, sourceUUID, targetUUID);
      if (edge) {
        this.styleElement(edge, color, 'cycle');
      }
    }
    
    // Mettre en évidence les nœuds (secondaire)
    cycleUUIDs.forEach(uuid => {
      const node = this.findNodeByUUID(svg, uuid);
      if (node) {
        this.styleElement(node, color, 'cycle');
      }
    });
  }
  
  /**
   * Highlight spécifique pour les paradoxes temporels
   */
  private highlightTemporalParadox(svg: Element, paradox: ParadoxHighlight, color: string): void {
    console.log(`[Temporal] Highlighting temporal paradox with ${paradox.relations.length} relations`);
    
    // Extraire et mettre en évidence toutes les relations impliquées
    paradox.relations.forEach(relation => {
      // Relation US -> US
      if (relation.us_anterieur && relation.us_posterieur) {
        const edge = this.findEdgeByUUIDs(svg, relation.us_posterieur, relation.us_anterieur);
        if (edge) this.styleElement(edge, color, 'temporal');
      }
      
      // Relation Fait -> Fait
      if (relation.fait_anterieur && relation.fait_posterieur) {
        const edge = this.findEdgeByUUIDs(svg, relation.fait_posterieur, relation.fait_anterieur);
        if (edge) this.styleElement(edge, color, 'temporal');
      }
      
      // Relation US -> Fait
      if (relation.us_anterieur && relation.fait_posterieur) {
        const edge = this.findEdgeByUUIDs(svg, relation.fait_posterieur, relation.us_anterieur);
        if (edge) this.styleElement(edge, color, 'temporal');
      }
      
      // Relation Fait -> US
      if (relation.fait_anterieur && relation.us_posterieur) {
        const edge = this.findEdgeByUUIDs(svg, relation.us_posterieur, relation.fait_anterieur);
        if (edge) this.styleElement(edge, color, 'temporal');
      }
    });
    
    // Mettre aussi en évidence les nœuds impliqués
    paradox.nodeIds.forEach(nodeId => {
      const uuid = this.extractUUIDFromNodeId(nodeId);
      if (uuid) {
        const node = this.findNodeByUUID(svg, uuid);
        if (node) this.styleElement(node, color, 'temporal');
      }
    });
  }
  
  /**
   * Highlight spécifique pour les paradoxes de cohérence
   */
  private highlightConsistencyParadox(svg: Element, paradox: ParadoxHighlight, color: string): void {
    console.log(`[Consistency] Highlighting consistency paradox with ${paradox.relations.length} relations`);
    
    // Mettre en évidence toutes les relations entre Faits
    paradox.relations.forEach(relation => {
      // Toutes les combinaisons possibles de relations
      const combinations = [
        { source: relation.us_posterieur, target: relation.us_anterieur },
        { source: relation.fait_posterieur, target: relation.fait_anterieur },
        { source: relation.fait_posterieur, target: relation.us_anterieur },
        { source: relation.us_posterieur, target: relation.fait_anterieur }
      ];
      
      combinations.forEach(({ source, target }) => {
        if (source && target) {
          const edge = this.findEdgeByUUIDs(svg, source, target);
          if (edge) this.styleElement(edge, color, 'cycle');
        }
      });
    });
    
    // Mettre en évidence les Faits impliqués
    paradox.nodeIds.forEach(nodeId => {
      const uuid = this.extractUUIDFromNodeId(nodeId);
      if (uuid) {
        const node = this.findNodeByUUID(svg, uuid);
        if (node) this.styleElement(node, color, 'cycle');
      }
    });
  }
  
  /**
   * Highlight spécifique pour les paradoxes de contenance
   */
  private highlightContainmentParadox(svg: Element, paradox: ParadoxHighlight, color: string): void {
    console.log(`[Containment] Highlighting containment paradox with ${paradox.relations.length} relations`);
    
    // D'abord, extraire tous les UUIDs des entités impliquées
    const allUUIDs = new Set<string>();
    const relationPairs: Array<{source: string, target: string}> = [];
    
    paradox.relations.forEach(relation => {
      // Collecter tous les UUIDs
      if (relation.us_anterieur) allUUIDs.add(relation.us_anterieur);
      if (relation.us_posterieur) allUUIDs.add(relation.us_posterieur);
      if (relation.fait_anterieur) allUUIDs.add(relation.fait_anterieur);
      if (relation.fait_posterieur) allUUIDs.add(relation.fait_posterieur);
      
      // Identifier toutes les paires de relations pour les flèches
      if (relation.us_anterieur && relation.us_posterieur) {
        relationPairs.push({
          source: relation.us_posterieur,
          target: relation.us_anterieur
        });
      }
      
      if (relation.fait_anterieur && relation.fait_posterieur) {
        relationPairs.push({
          source: relation.fait_posterieur,
          target: relation.fait_anterieur
        });
      }
      
      // Relations croisées Fait-US
      if (relation.fait_anterieur && relation.us_posterieur) {
        relationPairs.push({
          source: relation.us_posterieur,
          target: relation.fait_anterieur
        });
      }
      
      if (relation.us_anterieur && relation.fait_posterieur) {
        relationPairs.push({
          source: relation.fait_posterieur,
          target: relation.us_anterieur
        });
      }
    });
    
    console.log(`[Containment] Found ${allUUIDs.size} entities and ${relationPairs.length} relation pairs`);
    
    // Mettre en évidence toutes les flèches (relations)
    let highlightedEdges = 0;
    relationPairs.forEach(pair => {
      const edge = this.findEdgeByUUIDs(svg, pair.source, pair.target);
      if (edge) {
        this.styleElement(edge, color, 'containment');
        highlightedEdges++;
      }
    });
    
    console.log(`[Containment] Highlighted ${highlightedEdges} edges`);
    
    // Mettre en évidence tous les nœuds impliqués avec un style spécial
    let highlightedNodes = 0;
    allUUIDs.forEach(uuid => {
      const node = this.findNodeByUUID(svg, uuid);
      if (node) {
        this.styleElement(node, color, 'containment');
        highlightedNodes++;
      }
    });
    
    console.log(`[Containment] Highlighted ${highlightedNodes} nodes`);
  }

  /**
   * Style spécifique pour les nœuds de contenance
   */
  private styleNodeForContainment(node: Element, color: string): void {
    // Trouver toutes les formes dans le nœud
    const shapes = node.querySelectorAll('rect, polygon, circle, ellipse, path');
    
    shapes.forEach(shape => {
      const svgShape = shape as SVGElement;
      
      // Bordure colorée épaisse
      svgShape.style.stroke = color;
      svgShape.style.strokeWidth = '4px';
      
      // Effet de brillance (glow)
      svgShape.style.filter = `drop-shadow(0 0 10px ${color}) brightness(1.2)`;
      
      // Remplissage semi-transparent avec la couleur
      const originalFill = svgShape.style.fill || svgShape.getAttribute('fill');
      if (originalFill && originalFill !== 'none') {
        // Sauvegarder la couleur originale dans un data attribute
        svgShape.setAttribute('data-original-fill', originalFill);
        
        // Appliquer un fond coloré semi-transparent
        svgShape.style.fill = color;
        svgShape.style.fillOpacity = '0.3';
      }
    });
    
    // Animation de pulsation pour attirer l'attention
    node.classList.add('paradox-node-highlighted', 'paradox-node-containment');
    
    // Appliquer une animation au niveau du nœud
    const nodeElement = node as SVGElement;
    nodeElement.style.animation = 'paradox-node-glow 1.5s ease-in-out infinite';
  }

  /**
   * Style spécifique pour les arêtes de contenance
   */
  private styleEdgeForContainment(edge: Element, color: string): void {
    const svgPath = edge as SVGPathElement;
    
    // Style similaire aux autres types mais avec un pattern distinct
    svgPath.style.stroke = color;
    svgPath.style.strokeWidth = '5px';
    svgPath.style.opacity = '1';
    svgPath.style.strokeDasharray = '8, 4';
    svgPath.style.filter = `drop-shadow(0 0 8px ${color})`;
    
    // Animation plus lente pour différencier
    svgPath.style.animation = 'paradox-edge-flow 2s linear infinite';
    
    // S'assurer que l'arête est visible
    svgPath.style.zIndex = '1000';
    
    // Ajouter les classes CSS
    edge.classList.add('paradox-edge-highlighted', 'paradox-edge-containment');
  }

  
  /**
   * Trouve une arête par les UUIDs source et target
   */
  private findEdgeByUUIDs(svg: Element, sourceUUID: string, targetUUID: string): Element | null {
    const sourceId = `node_${sourceUUID.replace(/-/g, '_')}`;
    const targetId = `node_${targetUUID.replace(/-/g, '_')}`;
    
    // Chercher dans les deux sens
    const selectors = [
      `path.LS-${sourceId}.LE-${targetId}`,
      `path.LS-${targetId}.LE-${sourceId}`
    ];
    
    for (const selector of selectors) {
      const edge = svg.querySelector(selector);
      if (edge) {
        console.log(`[Edge] Found: ${sourceId} -> ${targetId}`);
        return edge;
      }
    }
    
    console.warn(`[Edge] Not found: ${sourceId} <-> ${targetId}`);
    return null;
  }
  
  /**
   * Trouve un nœud par son UUID
   */
  private findNodeByUUID(svg: Element, uuid: string): Element | null {
    const nodeId = `node_${uuid.replace(/-/g, '_')}`;
    
    // Essayer plusieurs sélecteurs
    const selectors = [
      `[data-id="${nodeId}"]`,
      `#flowchart-${nodeId}`,
      `[id*="${nodeId}"]`
    ];
    
    for (const selector of selectors) {
      const node = svg.querySelector(selector);
      if (node) {
        console.log(`[Node] Found: ${nodeId}`);
        return node;
      }
    }
    
    console.warn(`[Node] Not found: ${nodeId}`);
    return null;
  }

  /**
   * Applique le style à un ellement
   */
  private styleElement(element: Element, color: string, type: string): void {
    const svgPath = element as SVGPathElement;
    
    // Appliquer le style principal
    svgPath.style.stroke = color;
    svgPath.style.strokeWidth = '4px';
    svgPath.style.opacity = '1';
    svgPath.style.filter = `drop-shadow(0 0 6px ${color})`;

    svgPath.style.strokeDasharray = '15, 8';
    svgPath.style.animation = 'paradox-edge-flow 0.8s linear infinite';

    // Ajouter les classes CSS
    element.classList.add('paradox-edge-highlighted', `paradox-edge-${type}`);
  }
  
  /**
   * Applique le style à une arête
   */
  private styleEdge(edge: Element, color: string, type: string = 'cycle'): void {
    const svgPath = edge as SVGPathElement;
    
    // Appliquer le style principal
    svgPath.style.stroke = color;
    svgPath.style.strokeWidth = '4px';
    svgPath.style.opacity = '1';
    svgPath.style.filter = `drop-shadow(0 0 6px ${color})`;
    
    // Style spécifique par type
    switch (type) {
      case 'cycle':
        svgPath.style.strokeDasharray = '15, 8';
        svgPath.style.animation = 'paradox-edge-flow 0.8s linear infinite';
        break;
      case 'temporal':
        svgPath.style.strokeDasharray = '10, 5';
        svgPath.style.animation = 'paradox-edge-flow 1.2s linear infinite reverse';
        break;
      case 'consistency':
        svgPath.style.strokeDasharray = '20, 10';
        break;
      case 'containment':
        svgPath.style.strokeDasharray = '5, 5';
        break;
    }
    
    // Ajouter les classes CSS
    edge.classList.add('paradox-edge-highlighted', `paradox-edge-${type}`);
  }
  
  /**
   * Applique le style à un nœud
   */
  private styleNode(node: Element, color: string, type: string, emphasized: boolean = false): void {
    // Trouver les formes dans le nœud
    const shapes = node.querySelectorAll('rect, polygon, circle, ellipse, path');
    
    shapes.forEach(shape => {
      const svgShape = shape as SVGElement;
      svgShape.style.stroke = color;
      svgShape.style.strokeWidth = emphasized ? '4px' : '3px';
      svgShape.style.filter = `drop-shadow(0 0 ${emphasized ? '8px' : '5px'} ${color})`;
      
      // Pour la contenance, on peut aussi changer le fill avec transparence
      if (type === 'containment' && emphasized) {
        const originalFill = svgShape.style.fill || svgShape.getAttribute('fill');
        if (originalFill && originalFill !== 'none') {
          svgShape.style.fill = color;
          svgShape.style.fillOpacity = '0.2';
        }
      }
    });
    
    // Ajouter les classes CSS
    node.classList.add('paradox-node-highlighted', `paradox-node-${type}`);
  }
  
  /**
   * Extrait l'UUID d'un nodeId
   */
  private extractUUIDFromNodeId(nodeId: string): string | null {
    const match = nodeId.match(/node_(.+)/);
    if (match) {
      // Reconvertir les underscores en tirets
      return match[1].replace(/_/g, '-');
    }
    return null;
  }
  
  /**
   * Efface tous les highlights
   */
  clearAllHighlights(): void {
    if (!this.containerElement) return;
    
    const svg = this.containerElement.querySelector('svg');
    if (!svg) return;
    
    console.log('[ParadoxVisualization] Clearing all highlights');
    
    // Réinitialiser les arêtes
    const edges = svg.querySelectorAll('.paradox-edge-highlighted');
    edges.forEach(edge => {
      const svgPath = edge as SVGPathElement;
      svgPath.style.stroke = '';
      svgPath.style.strokeWidth = '';
      svgPath.style.strokeDasharray = '';
      svgPath.style.animation = '';
      svgPath.style.filter = '';
      svgPath.style.opacity = '';
      svgPath.style.zIndex = '';
      
      edge.classList.remove(
        'paradox-edge-highlighted',
        'paradox-edge-cycle',
        'paradox-edge-temporal',
        'paradox-edge-consistency',
        'paradox-edge-containment'
      );
    });
    
    // Réinitialiser les nœuds
    const nodes = svg.querySelectorAll('.paradox-node-highlighted');
    nodes.forEach(node => {
      const shapes = node.querySelectorAll('rect, polygon, circle, ellipse, path');
      shapes.forEach(shape => {
        const svgShape = shape as SVGElement;
        
        // Restaurer la couleur de remplissage originale si elle était sauvegardée
        const originalFill = svgShape.getAttribute('data-original-fill');
        if (originalFill) {
          svgShape.style.fill = originalFill;
          svgShape.removeAttribute('data-original-fill');
        } else {
          svgShape.style.fill = '';
        }
        
        // Réinitialiser tous les autres styles
        svgShape.style.stroke = '';
        svgShape.style.strokeWidth = '';
        svgShape.style.filter = '';
        svgShape.style.fillOpacity = '';
      });
      
      // Retirer l'animation du nœud
      const nodeElement = node as SVGElement;
      nodeElement.style.animation = '';
      
      node.classList.remove(
        'paradox-node-highlighted',
        'paradox-node-cycle',
        'paradox-node-temporal',
        'paradox-node-consistency',
        'paradox-node-containment'
      );
    });
  }
  
  /**
   * Rafraîchit les caches après modification du diagramme
   */
  refreshCaches(): void {
    if (this._isParadoxMode.value) {
      this.detectAllParadoxes();
    }
  }
  
  /**
   * Destroy
   */
  destroy(): void {
    this.clearAllHighlights();
    this.containerElement = null;
  }
}