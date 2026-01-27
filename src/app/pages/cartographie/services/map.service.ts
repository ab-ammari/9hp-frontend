import { Injectable, signal, computed } from '@angular/core';
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { defaults as defaultControls, ScaleLine, Attribution } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import Select from 'ol/interaction/Select';
import { click, pointerMove } from 'ol/events/condition';
import { Style, Fill, Stroke, Circle, Text } from 'ol/style';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';

import { ProjectionService } from './projection.service';
import { GmlParserService } from './gml-parser.service';
import {
  GeoFeature,
  MapConfig,
  CursorPosition,
  BaseMapType,
  MapLayer,
  ArcheoEntityType
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
  private _layers = signal<MapLayer[]>([]);
  private _currentBaseMap = signal<BaseMapType>('osm');

  // Signaux en lecture seule
  readonly map = this._map.asReadonly();
  readonly currentZoom = this._currentZoom.asReadonly();
  readonly currentCenter = this._currentCenter.asReadonly();
  readonly cursorPosition = this._cursorPosition.asReadonly();
  readonly selectedFeatures = this._selectedFeatures.asReadonly();
  readonly layers = this._layers.asReadonly();
  readonly currentBaseMap = this._currentBaseMap.asReadonly();

  // Computed
  readonly visibleLayers = computed(() =>
    this._layers().filter(l => l.visible)
  );

  // Interactions
  private selectInteraction: Select | null = null;
  private hoverInteraction: Select | null = null;

  // Couches vectorielles (pour gestion)
  private vectorLayers: Map<string, VectorLayer<VectorSource>> = new Map();

  // ═══════════════════════════════════════════════════════════════
  // Palettes de couleurs par type d'entité
  // ═══════════════════════════════════════════════════════════════
  private readonly colorPalettes: Record<string, string> = {
    'Fosses': '#e74c3c',
    'Fosses circulaires': '#c0392b',
    'Trous de poteau': '#f39c12',
    'Murs': '#95a5a6',
    'Fossés': '#3498db',
    'US': '#9b59b6',
    'Secteurs': '#2ecc71',
    'Points Topo': '#1abc9c',
    'Prélèvements': '#e91e63',
    'Mobilier': '#ff9800',
    'Photos': '#00bcd4',
    'default': '#607d8b'
  };

  constructor(
    private projectionService: ProjectionService,
    private gmlParser: GmlParserService
  ) { }

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

    // Ajouter le fond de carte par défaut
    this.addBaseLayer(map, 'osm');

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
  // Gestion des fonds de carte
  // ═══════════════════════════════════════════════════════════════

  /**
   * Ajoute ou change le fond de carte
   */
  addBaseLayer(map: OlMap, type: BaseMapType): void {
    // Supprimer l'ancien fond de carte
    map.getLayers().getArray()
      .filter(l => l.get('type') === 'base')
      .forEach(l => map.removeLayer(l));

    if (type === 'none') {
      this._currentBaseMap.set('none');
      return;
    }

    let source;

    switch (type) {
      case 'osm':
        source = new OSM();
        break;
      case 'satellite':
        source = new XYZ({
          url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          maxZoom: 20
        });
        break;
      case 'terrain':
        source = new XYZ({
          url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          maxZoom: 20
        });
        break;
      case 'ign':
        // IGN Géoportail (nécessite une clé API pour la production)
        source = new XYZ({
          url: 'https://wxs.ign.fr/decouverte/geoportail/wmts?' +
            'SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
            '&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal' +
            '&TILEMATRIXSET=PM&FORMAT=image/jpeg' +
            '&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}',
          maxZoom: 19
        });
        break;
      default:
        source = new OSM();
    }

    const baseLayer = new TileLayer({
      source,
      properties: { name: type, type: 'base' }
    });

    map.getLayers().insertAt(0, baseLayer);
    this._currentBaseMap.set(type);

    console.log('[MapService] Fond de carte changé:', type);
  }

  /**
   * Change le fond de carte actuel
   */
  setBaseMap(type: BaseMapType): void {
    const map = this._map();
    if (map) {
      this.addBaseLayer(map, type);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Gestion des couches de données
  // ═══════════════════════════════════════════════════════════════

  /**
   * Ajoute une couche de données archéologiques
   */
  addArcheoLayer(
    features: GeoFeature[],
    layerId: string,
    layerName: string,
    options?: { visible?: boolean; opacity?: number; zIndex?: number }
  ): VectorLayer<VectorSource> | null {

    const map = this._map();
    if (!map) {
      console.error('[MapService] Carte non initialisée');
      return null;
    }

    // Convertir les features en format OpenLayers
    const olFeatures = this.gmlParser.toOpenLayersFeatures(features);

    if (olFeatures.length === 0) {
      console.warn(`[MapService] Aucune feature valide pour la couche ${layerName}`);
      return null;
    }

    // Créer la source vectorielle
    const source = new VectorSource({ features: olFeatures });

    // Déterminer le type principal pour le style
    const mainType = features[0]?.gmlType || 'default';
    const color = this.colorPalettes[mainType] || this.colorPalettes['default'];

    // Créer la couche avec style
    const layer = new VectorLayer({
      source,
      style: this.createStyleFunction(color),
      properties: {
        id: layerId,
        name: layerName,
        type: 'archeo',
        gmlType: mainType
      },
      visible: options?.visible ?? true,
      opacity: options?.opacity ?? 1,
      zIndex: options?.zIndex ?? 10
    });

    map.addLayer(layer);
    this.vectorLayers.set(layerId, layer);

    // Mettre à jour la liste des couches
    const currentLayers = this._layers();
    this._layers.set([
      ...currentLayers,
      {
        id: layerId,
        name: layerName,
        type: 'archeo',
        visible: options?.visible ?? true,
        opacity: options?.opacity ?? 1,
        zIndex: options?.zIndex ?? 10,
        featureCount: features.length
      }
    ]);

    console.log(`[MapService] Couche "${layerName}" ajoutée avec ${features.length} features`);

    return layer;
  }

  /**
   * Crée une fonction de style pour une couleur donnée
   */
  private createStyleFunction(baseColor: string): (feature: Feature<Geometry>) => Style {
    return (feature: Feature<Geometry>) => {
      const geometryType = feature.getGeometry()?.getType();

      if (geometryType === 'Point') {
        return new Style({
          image: new Circle({
            radius: 6,
            fill: new Fill({ color: baseColor }),
            stroke: new Stroke({
              color: this.darkenColor(baseColor, 20),
              width: 2
            })
          })
        });
      } else {
        return new Style({
          fill: new Fill({
            color: this.hexToRgba(baseColor, 0.4)
          }),
          stroke: new Stroke({
            color: baseColor,
            width: 2
          })
        });
      }
    };
  }

  /**
   * Définit la visibilité d'une couche
   */
  setLayerVisibility(layerId: string, visible: boolean): void {
    const layer = this.vectorLayers.get(layerId);
    if (layer) {
      layer.setVisible(visible);

      // Mettre à jour l'état
      const layers = this._layers().map(l =>
        l.id === layerId ? { ...l, visible } : l
      );
      this._layers.set(layers);
    }
  }

  /**
   * Définit l'opacité d'une couche
   */
  setLayerOpacity(layerId: string, opacity: number): void {
    const layer = this.vectorLayers.get(layerId);
    if (layer) {
      layer.setOpacity(opacity);

      const layers = this._layers().map(l =>
        l.id === layerId ? { ...l, opacity } : l
      );
      this._layers.set(layers);
    }
  }

  /**
   * Supprime une couche
   */
  removeLayer(layerId: string): void {
    const map = this._map();
    const layer = this.vectorLayers.get(layerId);

    if (map && layer) {
      map.removeLayer(layer);
      this.vectorLayers.delete(layerId);

      const layers = this._layers().filter(l => l.id !== layerId);
      this._layers.set(layers);
    }
  }

  /**
   * Supprime toutes les couches de données
   */
  clearAllLayers(): void {
    const map = this._map();
    if (!map) return;

    this.vectorLayers.forEach((layer, id) => {
      map.removeLayer(layer);
    });

    this.vectorLayers.clear();
    this._layers.set([]);

    console.log('[MapService] Toutes les couches supprimées');
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

  /**
   * Zoome sur une étendue
   */
  zoomToExtent(extent: [number, number, number, number], padding = 50): void {
    const map = this._map();
    if (!map) return;

    map.getView().fit(extent, {
      padding: [padding, padding, padding, padding],
      duration: 500
    });
  }

  /**
   * Zoome sur toutes les features chargées
   */
  zoomToAllFeatures(): void {
    const map = this._map();
    if (!map) return;

    // Calculer l'étendue combinée de toutes les couches
    let combinedExtent: number[] | null = null;

    this.vectorLayers.forEach(layer => {
      const source = layer.getSource();
      if (source) {
        const extent = source.getExtent();
        if (extent && extent[0] !== Infinity) {
          if (!combinedExtent) {
            combinedExtent = [...extent];
          } else {
            combinedExtent[0] = Math.min(combinedExtent[0], extent[0]);
            combinedExtent[1] = Math.min(combinedExtent[1], extent[1]);
            combinedExtent[2] = Math.max(combinedExtent[2], extent[2]);
            combinedExtent[3] = Math.max(combinedExtent[3], extent[3]);
          }
        }
      }
    });

    if (combinedExtent) {
      this.zoomToExtent(combinedExtent as [number, number, number, number]);
    }
  }

  /**
   * Zoom avant
   */
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

  /**
   * Zoom arrière
   */
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

  /**
   * Définit le niveau de zoom
   */
  setZoom(zoom: number): void {
    const map = this._map();
    if (map) {
      map.getView().animate({ zoom, duration: 250 });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Utilitaires
  // ═══════════════════════════════════════════════════════════════

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  }

  /**
   * Détruit la carte
   */
  destroy(): void {
    const map = this._map();
    if (map) {
      map.setTarget(undefined);
      this._map.set(null);
      this.vectorLayers.clear();
      this._layers.set([]);
      this._selectedFeatures.set([]);
      console.log('[MapService] Carte détruite');
    }
  }
}
