import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { EdgeRelationResolverService, ResolvedRelation } from './edge-relation-resolver.service';
import { ApiStratigraphie } from '../../../shared';

export interface EdgeClickEvent {
  resolvedRelation: ResolvedRelation;
  edgeElement: SVGElement;
  mouseEvent: MouseEvent;
}

@Injectable({
  providedIn: 'root'
})
export class DiagramEditModeService {
    private _isEditMode = new BehaviorSubject<boolean>(false);
  public isEditMode$ = this._isEditMode. asObservable();

  private _edgeClicked = new Subject<EdgeClickEvent>();
  public edgeClicked$ = this._edgeClicked. asObservable();

  private containerElement: HTMLElement | null = null;
  private boundClickHandler: ((e: Event) => void) | null = null;

  constructor(
    private edgeResolver: EdgeRelationResolverService,
    private ngZone: NgZone
  ) {}

  initialize(container: HTMLElement): void {
    this.containerElement = container;
    console.log('[DiagramEditMode] Initialized');
  }

  updateRelations(relations: ApiStratigraphie[]): void {
    this.edgeResolver. updateRelationsCache(relations);
  }

  setEditMode(enabled: boolean): void {
    this._isEditMode.next(enabled);

    if (this.containerElement) {
      if (enabled) {
        this.enableEditMode();
      } else {
        this.disableEditMode();
      }
    }

    console.log(`[DiagramEditMode] Edit mode:  ${enabled}`);
  }

  toggleEditMode(): boolean {
    const newState = !this._isEditMode.value;
    this. setEditMode(newState);
    return newState;
  }

  private enableEditMode(): void {
    if (!this.containerElement) return;

    this. containerElement.classList.add('diagram-edit-mode');

    // Attacher le listener sur le SVG entier
    const svg = this.containerElement.querySelector('svg');
    if (svg) {
      this.boundClickHandler = (event: Event) => this.handleEdgeClick(event as MouseEvent);
      svg.addEventListener('click', this.boundClickHandler);
      
      // Marquer tous les paths comme éditables
      const paths = svg.querySelectorAll('path[class*="LS-"]');
      paths.forEach(path => {
        path.classList.add('editable-edge');
      });
      
      console.log(`[DiagramEditMode] Made ${paths.length} edges clickable`);
    }
  }

  private disableEditMode(): void {
    if (!this. containerElement) return;

    this.containerElement.classList.remove('diagram-edit-mode');

    const svg = this.containerElement.querySelector('svg');
    if (svg && this.boundClickHandler) {
      svg.removeEventListener('click', this.boundClickHandler);
      this.boundClickHandler = null;
    }

    this.clearAllHighlights();
  }

  /**
   * Gestionnaire de clic - CORRIGÉ
   */
  private handleEdgeClick(event: MouseEvent): void {
    const target = event.target as Element;
    
    console.log('[DiagramEditMode] Click detected on:', target. tagName, target.classList.toString());
    
    // Vérifier si on a cliqué directement sur un path avec LS-
    let clickedPath: Element | null = null;
    
    if (target.tagName. toLowerCase() === 'path' && target. classList.contains('flowchart-link')) {
      // Clic direct sur le path
      clickedPath = target;
    } else {
      // Peut-être un clic sur un élément enfant, chercher le path parent
      clickedPath = target.closest('path. flowchart-link');
    }

    if (! clickedPath) {
      console.log('[DiagramEditMode] Click was not on a flowchart-link path');
      return;
    }

    // Vérifier que ce path a bien les classes LS- et LE-
    const pathClasses = clickedPath.getAttribute('class') || '';
    if (!pathClasses. includes('LS-') || !pathClasses. includes('LE-')) {
      console.log('[DiagramEditMode] Path does not have LS-/LE- classes');
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    console.log('[DiagramEditMode] Edge path clicked');
    console.log('Path classes:', pathClasses);

    // Passer directement le PATH cliqué, pas son parent
    const resolved = this.edgeResolver.resolveEdgeToRelation(clickedPath);

    if (resolved) {
      // Highlight l'arête cliquée
      this.highlightEdge(clickedPath as SVGElement);

      // Émettre l'événement
      this. ngZone.run(() => {
        this._edgeClicked.next({
          resolvedRelation: resolved,
          edgeElement: clickedPath as SVGElement,
          mouseEvent: event
        });
      });
    } else {
      console.warn('[DiagramEditMode] Could not resolve edge to relation');
      this.edgeResolver.debugResolveEdge(clickedPath);
    }
  }

  highlightEdge(edgeElement: SVGElement): void {
    this.clearAllHighlights();
    edgeElement.classList. add('edge-highlighted');
  }

  markForDeletion(edgeElement: SVGElement): void {
    edgeElement.classList.add('edge-marked-for-deletion');
  }

  clearAllHighlights(): void {
    if (! this.containerElement) return;

    const highlighted = this.containerElement.querySelectorAll('.edge-highlighted, .edge-marked-for-deletion');
    highlighted.forEach(el => {
      el.classList.remove('edge-highlighted', 'edge-marked-for-deletion');
    });
  }

  destroy(): void {
    this.disableEditMode();
    this.containerElement = null;
  }

  debugAllEdges(): void {
    if (!this.containerElement) return;

    const paths = this.containerElement.querySelectorAll('path[class*="LS-"]');
    
    console.group(`[DiagramEditMode] All Edges (${paths.length})`);
    
    paths.forEach((path, index) => {
      const classes = path.getAttribute('class') || '';
      const sourceMatch = classes.match(/LS-(node_[a-f0-9_]+)/i);
      const targetMatch = classes.match(/LE-(node_[a-f0-9_]+)/i);
      
      console.log(`Edge ${index}:`, {
        source: sourceMatch?.[1],
        target: targetMatch?.[1]
      });
    });

    console.groupEnd();
  }
}