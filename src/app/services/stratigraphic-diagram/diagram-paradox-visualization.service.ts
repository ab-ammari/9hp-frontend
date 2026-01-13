import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { CastorValidationService, DetectedParadox, CycleParadox } from '../castor-validation.service';
import { WorkerService } from '../worker.service';
import { ApiStratigraphie } from '../../../../shared';
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

// Interface pour les groupes de contemporanéité
interface ContemporaryGroupInfo {
  displayTag: string;
  memberUUIDs: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DiagramParadoxVisualizationService {
  
  // États observables
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
   * Gère les cycles directs ET indirects
   */
  private highlightCycleParadox(svg: Element, paradox: ParadoxHighlight, color: string): void {
    const isIndirectCycle = paradox.metadata?.isIndirectCycle === true;
    const cycleNodeInfos = paradox.metadata?.cycleNodeInfos || [];
    const contemporaryGroups = paradox.metadata?.contemporaryGroups || [];
    
    console.log(`[Cycle] Is indirect: ${isIndirectCycle}`);
    console.log(`[Cycle] Contemporary groups:`, contemporaryGroups);
    console.log(`[Cycle] Relations count:`, paradox.relations.length);
    
    if (isIndirectCycle) {
      // ========================================
      // CYCLE INDIRECT
      // ========================================
      console.log(`[Cycle Indirect] Highlighting with ${paradox.relations.length} real relations`);
      
      // 1. Mettre en évidence les RELATIONS RÉELLES (flèches)
      //    Ce sont les relations entité→entité qui forment le cycle
      let edgesHighlighted = 0;
      paradox.relations.forEach(relation => {
        if (this.highlightRelationEdge(svg, relation, color, 'cycle')) {
          edgesHighlighted++;
        }
      });
      console.log(`[Cycle Indirect] Highlighted ${edgesHighlighted} edges`);
      
      // 2. Mettre en évidence les SUBGRAPHS (groupes de contemporanéité)
      let subgraphsHighlighted = 0;
      contemporaryGroups.forEach((group: ContemporaryGroupInfo) => {
        if (group.memberUUIDs && group.memberUUIDs.length > 1) {
          if (this.highlightContemporaryGroup(svg, group.memberUUIDs, color)) {
            subgraphsHighlighted++;
          }
        }
      });
      console.log(`[Cycle Indirect] Highlighted ${subgraphsHighlighted} subgraphs`);
      
      // 3. Mettre en évidence les NŒUDS individuels (style secondaire)
      let nodesHighlighted = 0;
      cycleNodeInfos.forEach((nodeInfo: any) => {
        if (nodeInfo.isGroup && nodeInfo.memberUUIDs) {
          // Groupe : highlight tous les membres avec style secondaire
          nodeInfo.memberUUIDs.forEach((memberUuid: string) => {
            const node = this.findNodeByUUID(svg, memberUuid);
            if (node) {
              this.styleParadoxNode(node, color, 'cycle');
              nodesHighlighted++;
            }
          });
        } else if (nodeInfo.memberUUIDs && nodeInfo.memberUUIDs.length === 1) {
          // Entité individuelle
          const node = this.findNodeByUUID(svg, nodeInfo.memberUUIDs[0]);
          if (node) {
            this.styleParadoxNode(node, color, 'cycle'); 
            nodesHighlighted++;
          }
        }
      });
      console.log(`[Cycle Indirect] Highlighted ${nodesHighlighted} nodes`);
      
    } else {
      // ========================================
      // CYCLE DIRECT (comportement existant)
      // ========================================
      const cycleUUIDs = paradox.metadata?.cycleNodesUUIDs;
      if (!cycleUUIDs || cycleUUIDs.length < 2) return;
      
      console.log(`[Cycle Direct] Highlighting cycle with ${cycleUUIDs.length} nodes`);
      
      // Mettre en évidence les arêtes du cycle
      for (let i = 0; i < cycleUUIDs.length; i++) {
        const sourceUUID = cycleUUIDs[i];
        const targetUUID = cycleUUIDs[(i + 1) % cycleUUIDs.length];
        
        const edge = this.findEdgeByUUIDs(svg, sourceUUID, targetUUID);
        if (edge) {
          this.styleEdge(edge, color, 'cycle');
        }
      }
      
      // Mettre en évidence les nœuds (secondaire)
      cycleUUIDs.forEach((uuid: string) => {
        const node = this.findNodeByUUID(svg, uuid);
        if (node) {
          this.styleParadoxNode(node, color, 'cycle');
        }
      });
    }
  }
  
  /**
   * Highlight spécifique pour les paradoxes temporels
   */
  private highlightTemporalParadox(svg: Element, paradox: ParadoxHighlight, color: string): void {
    console.log(`[Temporal] Highlighting temporal paradox with ${paradox.relations.length} relations`);
    
    // Extraire et mettre en évidence toutes les relations impliquées
    paradox.relations.forEach(relation => {
      this.highlightRelationEdge(svg, relation, color, 'temporal');
    });
    
    // Mettre aussi en évidence les nœuds impliqués
    paradox.nodeIds.forEach(nodeId => {
      const uuid = this.extractUUIDFromNodeId(nodeId);
      if (uuid) {
        const node = this.findNodeByUUID(svg, uuid);
        if (node) this.styleParadoxNode(node, color, 'temporal');
      }
    });
  }
  
  /**
   * Highlight spécifique pour les paradoxes de cohérence
   */
  private highlightConsistencyParadox(svg: Element, paradox: ParadoxHighlight, color: string): void {
    console.log(`[Consistency] Highlighting consistency paradox with ${paradox.relations.length} relations`);
    
    // Mettre en évidence toutes les relations
    paradox.relations.forEach(relation => {
      this.highlightRelationEdge(svg, relation, color, 'consistency');
    });
    
    // Mettre en évidence les nœuds impliqués
    paradox.nodeIds.forEach(nodeId => {
      const uuid = this.extractUUIDFromNodeId(nodeId);
      if (uuid) {
        const node = this.findNodeByUUID(svg, uuid);
        if (node) this.styleParadoxNode(node, color, 'consistency');
      }
    });
  }
  
  /**
   * Highlight spécifique pour les paradoxes de contenance
   */
  private highlightContainmentParadox(svg: Element, paradox: ParadoxHighlight, color: string): void {
    console.log(`[Containment] Highlighting containment paradox with ${paradox.relations.length} relations`);
    
    // Collecter tous les UUIDs
    const allUUIDs = new Set<string>();
    
    paradox.relations.forEach(relation => {
      if (relation.us_anterieur) allUUIDs.add(relation.us_anterieur);
      if (relation.us_posterieur) allUUIDs.add(relation.us_posterieur);
      if (relation.fait_anterieur) allUUIDs.add(relation.fait_anterieur);
      if (relation.fait_posterieur) allUUIDs.add(relation.fait_posterieur);
      
      // Highlight les flèches
      this.highlightRelationEdge(svg, relation, color, 'containment');
    });
    
    // Mettre en évidence tous les nœuds impliqués
    allUUIDs.forEach(uuid => {
      const node = this.findNodeByUUID(svg, uuid);
      if (node) {
        this.styleParadoxNode(node, color, 'containment');
      }
    });
  }

  /**
   * Met en évidence une relation (flèche) à partir de l'objet ApiStratigraphie
   * @returns true si la flèche a été trouvée et mise en évidence
   */
  private highlightRelationEdge(
    svg: Element, 
    relation: ApiStratigraphie, 
    color: string, 
    type: string
  ): boolean {
    // Ne pas traiter les relations de contemporanéité (pas de flèches)
    if (relation.is_contemporain) {
      console.log(`[Edge] Skipping contemporaneity relation`);
      return false;
    }
    
    // Extraire source et target de la relation temporelle
    // Source = entité postérieure (plus récente, en haut du diagramme)
    // Target = entité antérieure (plus ancienne, en bas du diagramme)
    const sourceUUID = relation.us_posterieur || relation.fait_posterieur;
    const targetUUID = relation.us_anterieur || relation.fait_anterieur;
    
    if (!sourceUUID || !targetUUID) {
      console.warn(`[Edge] Invalid relation: missing source or target`);
      return false;
    }
    
    // Chercher la flèche dans le SVG
    let edge = this.findEdgeByUUIDs(svg, sourceUUID, targetUUID);
    
    // Si pas trouvée, essayer dans l'autre sens
    if (!edge) {
      edge = this.findEdgeByUUIDs(svg, targetUUID, sourceUUID);
    }
    
    if (edge) {
      this.styleEdge(edge, color, type);
      console.log(`[Edge] Highlighted: ${sourceUUID.substring(0,8)} → ${targetUUID.substring(0,8)}`);
      return true;
    } else {
      console.warn(`[Edge] Not found: ${sourceUUID.substring(0,8)} → ${targetUUID.substring(0,8)}`);
      return false;
    }
  }
  
  /**
   * Met en évidence un groupe de contemporanéité (subgraph)
   * @returns true si le subgraph a été trouvé et mis en évidence
   */
  private highlightContemporaryGroup(
    svg: Element, 
    memberUUIDs: string[], 
    color: string
  ): boolean {
    if (!memberUUIDs || memberUUIDs.length < 2) {
      return false;
    }
    
    console.log(`[Subgraph] Looking for group with members:`, memberUUIDs.map(u => u.substring(0,8)));
    
    // Stratégie 1 : Trouver le subgraph qui contient tous les membres
    const subgraphs = svg.querySelectorAll('g.subgraph.contemporary-group');
    
    for (const subgraph of Array.from(subgraphs)) {
      // Vérifier si ce subgraph contient au moins un des nœuds du groupe
      const containsAtLeastOne = memberUUIDs.some(uuid => {
        const nodeId = `node_${uuid.replace(/-/g, '_')}`;
        return subgraph.querySelector(`[data-id="${nodeId}"], [id*="${nodeId}"]`) !== null;
      });
      
      if (containsAtLeastOne) {
        // Appliquer le style au subgraph
        this.styleSubgraph(subgraph, color);
        console.log(`[Subgraph] Highlighted group containing ${memberUUIDs.length} members`);
        return true;
      }
    }
    
    // Stratégie 2 : Si pas de subgraph trouvé, on peut créer un effet visuel
    // en mettant en évidence tous les nœuds membres avec un style spécial "groupe"
    console.warn(`[Subgraph] No subgraph found, highlighting individual members with group style`);
    memberUUIDs.forEach(uuid => {
      const node = this.findNodeByUUID(svg, uuid);
      if (node) {
        this.styleParadoxNode(node, color, 'cycle');
      }
    });
    
    return false;
  }
  

  /**
   * Applique le style de highlight à un subgraph
   */
  private styleSubgraph(subgraph: Element, color: string): void {
    // Trouver le rect du subgraph
    const rect = subgraph.querySelector('rect.subgraph');
    
    if (rect) {
      const svgRect = rect as SVGRectElement;
      
      // Sauvegarder les styles originaux
      svgRect.setAttribute('data-original-stroke', svgRect.style.stroke || svgRect.getAttribute('stroke') || '');
      svgRect.setAttribute('data-original-stroke-width', svgRect.style.strokeWidth || '');
      svgRect.setAttribute('data-original-stroke-dasharray', svgRect.style.strokeDasharray || '');
      
      // Appliquer le nouveau style
      svgRect.style.stroke = color;
      svgRect.style.strokeWidth = '4px';
      svgRect.style.strokeDasharray = '8, 4';
      svgRect.style.filter = `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 6px ${color})`;
      
      // Animation CSS sera appliquée via la classe
    }
    
    // Ajouter la classe pour les animations CSS
    subgraph.classList.add('paradox-subgraph-highlighted', 'paradox-subgraph-cycle');
  }

  /**
   * Style unifié pour tous les nœuds impliqués dans un paradoxe
   * (Anciennement styleNodeAsGroupMember - maintenant appliqué à tous)
   */
  private styleParadoxNode(node: Element, color: string, type: string): void {
    const shapes = node.querySelectorAll('rect, polygon, circle, ellipse, path');
    
    shapes.forEach(shape => {
      const svgShape = shape as SVGElement;
      
      // Sauvegarder les styles originaux
      if (!svgShape.hasAttribute('data-original-stroke')) {
        svgShape.setAttribute('data-original-stroke', svgShape.style.stroke || svgShape.getAttribute('stroke') || '');
        svgShape.setAttribute('data-original-stroke-width', svgShape.style.strokeWidth || '');
        svgShape.setAttribute('data-original-stroke-dasharray', svgShape.style.strokeDasharray || '');
      }
      
      // Bordure en pointillés + glow
      svgShape.style.stroke = color;
      svgShape.style.strokeWidth = '3px';
      svgShape.style.strokeDasharray = '5, 3';
      svgShape.style.filter = `drop-shadow(0 0 6px ${color})`;
    });
    
    node.classList.add('paradox-node-highlighted', `paradox-node-${type}`);
  }
  
  /**
   * Trouve une arête par les UUIDs source et target
   */
  private findEdgeByUUIDs(svg: Element, sourceUUID: string, targetUUID: string): Element | null {
    const sourceId = `node_${sourceUUID.replace(/-/g, '_')}`;
    const targetId = `node_${targetUUID.replace(/-/g, '_')}`;
    
    // Chercher avec les classes LS- et LE-
    const selectors = [
      `path.LS-${sourceId}.LE-${targetId}`,
      `path.LS-${targetId}.LE-${sourceId}`
    ];
    
    for (const selector of selectors) {
      const edge = svg.querySelector(selector);
      if (edge) {
        return edge;
      }
    }
    
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
        return node;
      }
    }
    
    return null;
  }

  /**
   * Applique le style à une arête
   */
  private styleEdge(edge: Element, color: string, type: string): void {
    const svgPath = edge as SVGPathElement;
    
    // Sauvegarder les styles originaux
    svgPath.setAttribute('data-original-stroke', svgPath.style.stroke || '');
    svgPath.setAttribute('data-original-stroke-width', svgPath.style.strokeWidth || '');
    
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
      
      // Restaurer les styles originaux
      const originalStroke = svgPath.getAttribute('data-original-stroke');
      const originalStrokeWidth = svgPath.getAttribute('data-original-stroke-width');
      
      svgPath.style.stroke = originalStroke || '';
      svgPath.style.strokeWidth = originalStrokeWidth || '';
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
        
        // Restaurer les styles originaux
        const originalStroke = svgShape.getAttribute('data-original-stroke');
        const originalStrokeWidth = svgShape.getAttribute('data-original-stroke-width');
        const originalFill = svgShape.getAttribute('data-original-fill');
        const originalStrokeDasharray = svgShape.getAttribute('data-original-stroke-dasharray');  // AJOUTER
        const originalAnimation = svgShape.getAttribute('data-original-animation');   

        svgShape.style.stroke = originalStroke || '';
        svgShape.style.strokeWidth = originalStrokeWidth || '';
        svgShape.style.strokeDasharray = originalStrokeDasharray || '';  // AJOUTER
        svgShape.style.animation = originalAnimation || '';
        svgShape.style.filter = '';
        svgShape.style.fillOpacity = '';
        
        if (originalFill) {
          svgShape.style.fill = originalFill;
        }
      });
      
      const nodeElement = node as SVGElement;
      nodeElement.style.animation = '';
      
      node.classList.remove(
        'paradox-node-highlighted',
        'paradox-node-cycle',
        'paradox-node-temporal',
        'paradox-node-consistency',
        'paradox-node-containment',
        'paradox-node-group-member'
      );
    });
    
    // Réinitialiser les subgraphs
    const subgraphs = svg.querySelectorAll('.paradox-subgraph-highlighted');
    subgraphs.forEach(subgraph => {
      const rect = subgraph.querySelector('rect.subgraph');
      if (rect) {
        const svgRect = rect as SVGRectElement;
        
        // Restaurer les styles originaux
        const originalStroke = svgRect.getAttribute('data-original-stroke');
        const originalStrokeWidth = svgRect.getAttribute('data-original-stroke-width');
        const originalStrokeDasharray = svgRect.getAttribute('data-original-stroke-dasharray');
        
        svgRect.style.stroke = originalStroke || '';
        svgRect.style.strokeWidth = originalStrokeWidth || '';
        svgRect.style.strokeDasharray = originalStrokeDasharray || '';
        svgRect.style.filter = '';
      }
      
      subgraph.classList.remove(
        'paradox-subgraph-highlighted',
        'paradox-subgraph-cycle'
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