import { Injectable, signal, computed } from '@angular/core';
import OlMap from 'ol/Map';
import View from 'ol/View';
import { defaults as defaultControls, ScaleLine, Attribution } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import Select from 'ol/interaction/Select';
import { click, pointerMove } from 'ol/events/condition';
import { Style, Fill, Stroke, Circle } from 'ol/style';

import { ProjectionService } from './projection.service';
import { LayerService } from './layer.service';
import {
  GeoFeature,
  MapConfig,
  CursorPosition,
  BaseMapType,
  MapLayer
} from '../models/geo-feature.model';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  // ═══════════════════════════════════════════════════════════════
  // État de la carte avec Signals
  // ═══════════════════════════════════════════════════════════════
  private _map = signal<OlMap | null>(null);
  private _currentZoom = signal<number>(15);
  private _currentCenter = signal<[number, number]>([700000, 6600000]);
  private _cursorPosition = signal<CursorPosition | null>(null);
  private _selectedFeatures = signal<GeoFeature[]>([]);

  // Signaux en lecture seule
  readonly map = this._map.asReadonly();
  readonly currentZoom = this._currentZoom.asReadonly();
  readonly currentCenter = this._currentCenter.asReadonly();
  readonly cursorPosition = this._cursorPosition.asReadonly();
  readonly selectedFeatures = this._selectedFeatures.asReadonly();

  // Délégation vers LayerService
  readonly layers = computed(() => this.layerService.layers());
  readonly currentBaseMap = computed(() => this.layerService.currentBaseMap());
  readonly visibleLayers = computed(() => this.layerService.visibleLayers());

  // Interactions
  private selectInteraction: Select | null = null;
  private hoverInteraction: Select | null = null;

  constructor(
    private projectionService: ProjectionService,
    private layerService: LayerService
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // Initialisation de la carte
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialise la carte dans un élément DOM
   */
  initializeMap(targetElement: HTMLElement, config?: MapConfig): OlMap {
    const crs = config?.crs || 'EPSG:2154';
    const center = config?.center || [700000, 6600000];
    const zoom = config?.zoom || 15;

    // Vérifier que la projection est disponible
    if (!this.projectionService.isProjectionAvailable(crs)) {
      console.warn(`[MapService] Projection ${crs} non disponible, utilisation de EPSG:3857`);
    }

    // Créer la vue
    const view = new View({
      projection: crs,
      center: center,
      zoom: zoom,
      minZoom: config?.minZoom || 5,
      maxZoom: config?.maxZoom || 22
    });

    // Créer la carte
    const map = new OlMap({
      target: targetElement,
      view: view,
      controls: defaultControls({ attribution: false }).extend([
        new ScaleLine({ units: 'metric' }),
        new Attribution({ collapsible: true })
      ]),
      interactions: defaultInteractions({
        doubleClickZoom: true,
        dragPan: true,
        mouseWheelZoom: true
      })
    });

    // Initialiser le LayerService avec la carte
    this.layerService.setMap(map);

    // Ajouter le fond de carte par défaut
    this.layerService.setBaseMap('osm');

    // Configurer les événements
    this.setupMapEvents(map);

    // Configurer les interactions de sélection
    this.setupSelectInteraction(map);

    this._map.set(map);
    this.projectionService.setCurrentCRS(crs);

    console.log('[MapService] Carte initialisée avec CRS:', crs);

    return map;
  }

  // ═══════════════════════════════════════════════════════════════
  // Délégation vers LayerService
  // ═══════════════════════════════════════════════════════════════

  setBaseMap(type: BaseMapType): void {
    this.layerService.setBaseMap(type);
  }

  addArcheoLayer(
    features: GeoFeature[],
    layerId: string,
    layerName: string,
    options?: { visible?: boolean; opacity?: number; zIndex?: number }
  ) {
    return this.layerService.addArcheoLayer(features, layerId, layerName, options);
  }

  setLayerVisibility(layerId: string, visible: boolean): void {
    this.layerService.setLayerVisibility(layerId, visible);
  }

  setLayerOpacity(layerId: string, opacity: number): void {
    this.layerService.setLayerOpacity(layerId, opacity);
  }

  removeLayer(layerId: string): void {
    this.layerService.removeLayer(layerId);
  }

  clearAllLayers(): void {
    this.layerService.clearAllLayers();
  }

  zoomToAllFeatures(): void {
    this.layerService.zoomToAllLayers();
  }

  // ═══════════════════════════════════════════════════════════════
  // Événements de la carte
  // ═══════════════════════════════════════════════════════════════

  private setupMapEvents(map: OlMap): void {
    // Mise à jour du zoom
    map.getView().on('change:resolution', () => {
      this._currentZoom.set(map.getView().getZoom() || 15);
    });

    // Mise à jour du centre
    map.getView().on('change:center', () => {
      const center = map.getView().getCenter();
      if (center) {
        this._currentCenter.set(center as [number, number]);
      }
    });

    // Position du curseur
    map.on('pointermove', (evt) => {
      if (evt.dragging) return;

      const coord = evt.coordinate;
      this._cursorPosition.set({
        x: Math.round(coord[0] * 1000) / 1000,
        y: Math.round(coord[1] * 1000) / 1000
      });
    });

    // Quitter la carte
    map.getViewport().addEventListener('mouseout', () => {
      this._cursorPosition.set(null);
    });
  }

  private setupSelectInteraction(map: OlMap): void {
    // Sélection au clic
    this.selectInteraction = new Select({
      condition: click,
      style: new Style({
        fill: new Fill({ color: 'rgba(255, 235, 59, 0.5)' }),
        stroke: new Stroke({ color: '#ffc107', width: 4 }),
        image: new Circle({
          radius: 10,
          fill: new Fill({ color: 'rgba(255, 235, 59, 0.8)' }),
          stroke: new Stroke({ color: '#ffc107', width: 3 })
        })
      })
    });

    this.selectInteraction.on('select', (evt) => {
      const selected = evt.selected.map(f => ({
        id: f.getId() as string,
        ...f.getProperties()
      } as GeoFeature));

      this._selectedFeatures.set(selected);
      console.log('[MapService] Features sélectionnées:', selected.length);
    });

    map.addInteraction(this.selectInteraction);

    // Survol
    this.hoverInteraction = new Select({
      condition: pointerMove,
      style: new Style({
        fill: new Fill({ color: 'rgba(100, 181, 246, 0.3)' }),
        stroke: new Stroke({ color: '#2196f3', width: 3 }),
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: 'rgba(100, 181, 246, 0.6)' }),
          stroke: new Stroke({ color: '#2196f3', width: 2 })
        })
      })
    });

    map.addInteraction(this.hoverInteraction);
  }

  // ═══════════════════════════════════════════════════════════════
  // Navigation et zoom
  // ═══════════════════════════════════════════════════════════════

  zoomToExtent(extent: [number, number, number, number], padding = 50): void {
    const map = this._map();
    if (!map) return;

    map.getView().fit(extent, {
      padding: [padding, padding, padding, padding],
      duration: 500
    });
  }

  zoomIn(): void {
    const map = this._map();
    if (map) {
      const view = map.getView();
      const zoom = view.getZoom();
      if (zoom !== undefined) {
        view.animate({ zoom: zoom + 1, duration: 250 });
      }
    }
  }

  zoomOut(): void {
    const map = this._map();
    if (map) {
      const view = map.getView();
      const zoom = view.getZoom();
      if (zoom !== undefined) {
        view.animate({ zoom: zoom - 1, duration: 250 });
      }
    }
  }

  setZoom(zoom: number): void {
    const map = this._map();
    if (map) {
      map.getView().animate({ zoom, duration: 250 });
    }
  }

  /**
   * Détruit la carte
   */
  destroy(): void {
    const map = this._map();
    if (map) {
      map.setTarget(undefined);
      this._map.set(null);
      this.layerService.clearAllLayers();
      this._selectedFeatures.set([]);
      console.log('[MapService] Carte détruite');
    }
  }
}