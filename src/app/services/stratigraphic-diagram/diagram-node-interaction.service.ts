import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { WorkerService } from '../worker.service';
import { ApiSyncableObject, ApiDbTable } from '../../../../shared';

export interface NodeInteractionEvent {
  nodeId: string;
  uuid: string;
  type: 'us' | 'fait';
  label: string;
  object: ApiSyncableObject | null;
  position: { x: number; y: number };
  nodeElement: SVGGElement;
}

export interface NodeHoverEvent {
  nodeId: string;
  uuid: string;
  type: 'us' | 'fait';
  isHovering: boolean;
  position: { x: number; y: number };
}

@Injectable({
  providedIn: 'root'
})
export class DiagramNodeInteractionService {
  
  private _nodeClicked = new Subject<NodeInteractionEvent>();
  private _nodeLongPressed = new Subject<NodeInteractionEvent>();
  private _nodeHover = new Subject<NodeHoverEvent>();
  
  public nodeClicked$: Observable<NodeInteractionEvent> = this._nodeClicked.asObservable();
  public nodeLongPressed$: Observable<NodeInteractionEvent> = this._nodeLongPressed.asObservable();
  public nodeHover$: Observable<NodeHoverEvent> = this._nodeHover.asObservable();
  
  private containerElement: HTMLElement | null = null;
  private longPressTimer: any = null;
  private longPressThreshold = 500; // ms pour le long press (mobile)
  private isLongPress = false;
  
  // Handlers liés pour pouvoir les retirer
  private boundHandlers: {
    click: ((e: Event) => void) | null;
    touchStart: ((e: Event) => void) | null;
    touchEnd: ((e: Event) => void) | null;
    touchMove: ((e: Event) => void) | null;
    mouseEnter: ((e: Event) => void) | null;
    mouseLeave: ((e: Event) => void) | null;
  } = {
    click: null,
    touchStart: null,
    touchEnd: null,
    touchMove: null,
    mouseEnter: null,
    mouseLeave: null
  };
  
  constructor(
    private w: WorkerService,
    private ngZone: NgZone
  ) {}
  
  /**
   * Initialise le service avec le conteneur du diagramme
   */
  initialize(container: HTMLElement): void {
    this.destroy(); // Nettoyer les anciens handlers
    this.containerElement = container;
    this.attachEventListeners();
    console.log('[DiagramNodeInteraction] Initialized');
  }
  
  /**
   * Attache les écouteurs d'événements sur le SVG
   */
  private attachEventListeners(): void {
    if (!this.containerElement) return;
    
    const svg = this.containerElement.querySelector('svg');
    if (!svg) {
      console.warn('[DiagramNodeInteraction] SVG not found');
      return;
    }
    
    // Créer les handlers liés
    this.boundHandlers.click = (e: Event) => this.handleClick(e as MouseEvent);
    this.boundHandlers.touchStart = (e: Event) => this.handleTouchStart(e as TouchEvent);
    this.boundHandlers.touchEnd = (e: Event) => this.handleTouchEnd(e as TouchEvent);
    this.boundHandlers.touchMove = (e: Event) => this.handleTouchMove(e as TouchEvent);
    this.boundHandlers.mouseEnter = (e: Event) => this.handleMouseEnter(e as MouseEvent);
    this.boundHandlers.mouseLeave = (e: Event) => this.handleMouseLeave(e as MouseEvent);
    
    // Attacher les listeners
    svg.addEventListener('click', this.boundHandlers.click);
    svg.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: false });
    svg.addEventListener('touchend', this.boundHandlers.touchEnd);
    svg.addEventListener('touchmove', this.boundHandlers.touchMove);
    svg.addEventListener('mouseover', this.boundHandlers.mouseEnter);
    svg.addEventListener('mouseout', this.boundHandlers.mouseLeave);
    
    // Ajouter la classe pour les styles de curseur
    this.markNodesAsClickable(svg);
  }
  
  /**
   * Marque tous les nœuds comme cliquables (curseur pointer)
   */
  private markNodesAsClickable(svg: SVGSVGElement): void {
    const nodes = svg.querySelectorAll('g.node[data-id^="node_"]');
    nodes.forEach(node => {
      node.classList.add('clickable-node');
    });
    console.log(`[DiagramNodeInteraction] Marked ${nodes.length} nodes as clickable`);
  }
  
  /**
   * Gère le clic sur un nœud
   */
  private handleClick(event: MouseEvent): void {
    if (this.isLongPress) {
      this.isLongPress = false;
      return;
    }
    
    const nodeElement = this.findNodeElement(event.target as Element);
    if (!nodeElement) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const interactionEvent = this.createInteractionEvent(nodeElement, event);
    if (interactionEvent) {
      this.ngZone.run(() => {
        this._nodeClicked.next(interactionEvent);
      });
    }
  }
  
  /**
   * Gère le début du touch (pour long press mobile)
   */
  private handleTouchStart(event: TouchEvent): void {
    const nodeElement = this.findNodeElement(event.target as Element);
    if (!nodeElement) return;
    
    this.isLongPress = false;
    
    const touch = event.touches[0];
    
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true;
      
      const interactionEvent = this.createInteractionEvent(nodeElement, {
        clientX: touch.clientX,
        clientY: touch.clientY
      } as MouseEvent);
      
      if (interactionEvent) {
        // Vibration feedback sur mobile (si supporté)
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        this.ngZone.run(() => {
          this._nodeLongPressed.next(interactionEvent);
        });
      }
    }, this.longPressThreshold);
  }
  
  /**
   * Gère la fin du touch
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    // Si ce n'était pas un long press, traiter comme un clic
    if (!this.isLongPress) {
      const nodeElement = this.findNodeElement(event.target as Element);
      if (nodeElement && event.changedTouches.length > 0) {
        const touch = event.changedTouches[0];
        
        const interactionEvent = this.createInteractionEvent(nodeElement, {
          clientX: touch.clientX,
          clientY: touch.clientY
        } as MouseEvent);
        
        if (interactionEvent) {
          event.preventDefault();
          this.ngZone.run(() => {
            this._nodeClicked.next(interactionEvent);
          });
        }
      }
    }
    
    this.isLongPress = false;
  }
  
  /**
   * Gère le mouvement du touch (annule le long press)
   */
  private handleTouchMove(event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }
  
  /**
   * Gère le survol d'un nœud
   */
  private handleMouseEnter(event: MouseEvent): void {
    const nodeElement = this.findNodeElement(event.target as Element);
    if (!nodeElement) return;
    
    const nodeInfo = this.extractNodeInfo(nodeElement);
    if (!nodeInfo) return;
    
    this.ngZone.run(() => {
      this._nodeHover.next({
        nodeId: nodeInfo.nodeId,
        uuid: nodeInfo.uuid,
        type: nodeInfo.type,
        isHovering: true,
        position: { x: event.clientX, y: event.clientY }
      });
    });
  }
  
  /**
   * Gère la sortie du survol
   */
  private handleMouseLeave(event: MouseEvent): void {
    const nodeElement = this.findNodeElement(event.target as Element);
    if (!nodeElement) return;
    
    const nodeInfo = this.extractNodeInfo(nodeElement);
    if (!nodeInfo) return;
    
    this.ngZone.run(() => {
      this._nodeHover.next({
        nodeId: nodeInfo.nodeId,
        uuid: nodeInfo.uuid,
        type: nodeInfo.type,
        isHovering: false,
        position: { x: event.clientX, y: event.clientY }
      });
    });
  }
  
  /**
   * Trouve l'élément nœud parent à partir d'un élément cliqué
   */
  private findNodeElement(target: Element): SVGGElement | null {
    // Remonter jusqu'à trouver un g.node avec data-id
    let current: Element | null = target;
    
    while (current && current !== this.containerElement) {
      if (
        current.tagName.toLowerCase() === 'g' &&
        current.classList.contains('node') &&
        current.hasAttribute('data-id')
      ) {
        const dataId = current.getAttribute('data-id') || '';
        if (dataId.startsWith('node_')) {
          return current as SVGGElement;
        }
      }
      current = current.parentElement;
    }
    
    return null;
  }
  
  /**
   * Extrait les informations d'un nœud
   */
  private extractNodeInfo(nodeElement: SVGGElement): { nodeId: string; uuid: string; type: 'us' | 'fait'; label: string } | null {
    const dataId = nodeElement.getAttribute('data-id');
    if (!dataId) return null;
    
    // Convertir node_uuid_xxx en uuid format standard
    const uuid = dataId.replace('node_', '').replace(/_/g, '-');
    
    // Déterminer le type (us ou fait) via les classes
    const isUs = nodeElement.classList.contains('usStyle');
    const isFait = nodeElement.classList.contains('faitStyle');
    const type: 'us' | 'fait' = isUs ? 'us' : (isFait ? 'fait' : 'us');
    
    // Récupérer le label
    const labelElement = nodeElement.querySelector('.nodeLabel');
    const label = labelElement?.textContent?.trim() || uuid.substring(0, 8);
    
    return { nodeId: dataId, uuid, type, label };
  }
  
  /**
   * Crée un événement d'interaction complet
   */
  private createInteractionEvent(nodeElement: SVGGElement, mouseEvent: MouseEvent): NodeInteractionEvent | null {
    const nodeInfo = this.extractNodeInfo(nodeElement);
    if (!nodeInfo) return null;
    
    // Récupérer l'objet complet depuis le WorkerService
    let object: ApiSyncableObject | null = null;
    
    if (nodeInfo.type === 'us') {
      const usWrapper = this.w.data().objects.us.all.findByUuid(nodeInfo.uuid);
      object = usWrapper?.item || null;
    } else {
      const faitWrapper = this.w.data().objects.fait.all.findByUuid(nodeInfo.uuid);
      object = faitWrapper?.item || null;
    }
    
    return {
      nodeId: nodeInfo.nodeId,
      uuid: nodeInfo.uuid,
      type: nodeInfo.type,
      label: nodeInfo.label,
      object,
      position: { x: mouseEvent.clientX, y: mouseEvent.clientY },
      nodeElement
    };
  }
  
  /**
   * Rafraîchit les listeners (après régénération du diagramme)
   */
  refresh(): void {
    if (this.containerElement) {
      this.attachEventListeners();
    }
  }
  
  /**
   * Nettoie les ressources
   */
  destroy(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    if (this.containerElement) {
      const svg = this.containerElement.querySelector('svg');
      if (svg) {
        if (this.boundHandlers.click) {
          svg.removeEventListener('click', this.boundHandlers.click);
        }
        if (this.boundHandlers.touchStart) {
          svg.removeEventListener('touchstart', this.boundHandlers.touchStart);
        }
        if (this.boundHandlers.touchEnd) {
          svg.removeEventListener('touchend', this.boundHandlers.touchEnd);
        }
        if (this.boundHandlers.touchMove) {
          svg.removeEventListener('touchmove', this.boundHandlers.touchMove);
        }
        if (this.boundHandlers.mouseEnter) {
          svg.removeEventListener('mouseover', this.boundHandlers.mouseEnter);
        }
        if (this.boundHandlers.mouseLeave) {
          svg.removeEventListener('mouseout', this.boundHandlers.mouseLeave);
        }
      }
    }
    
    this.boundHandlers = {
      click: null,
      touchStart: null,
      touchEnd: null,
      touchMove: null,
      mouseEnter: null,
      mouseLeave: null
    };
    
    this.containerElement = null;
    console.log('[DiagramNodeInteraction] Destroyed');
  }
}
