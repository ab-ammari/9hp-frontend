import { Injectable, signal, computed } from '@angular/core';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { get as getProjection } from 'ol/proj';
import { getTopLeft, getWidth } from 'ol/extent';
import OlMap from 'ol/Map';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';

import { StyleService } from './style.service';
import { GmlParserService } from './gml-parser.service';
import { 
  GeoFeature, 
  MapLayer, 
  BaseMapType, 
  BaseMapConfig,
  LayerGroup 
} from '../models/geo-feature.model';

@Injectable({
  providedIn: 'root'
})
export class LayerService {

  // ═══════════════════════════════════════════════════════════════
  // État des couches avec Signals
  // ═══════════════════════════════════════════════════════════════

  private _layers = signal<MapLayer[]>([]);
  private _currentBaseMap = signal<BaseMapType>('osm');
  private _layerGroups = signal<LayerGroup[]>([]);

  // Signaux en lecture seule
  readonly layers = this._layers.asReadonly();
  readonly currentBaseMap = this._currentBaseMap.asReadonly();
  readonly layerGroups = this._layerGroups.asReadonly();

  // Computed
  readonly visibleLayers = computed(() => 
    this._layers().filter(l => l.visible)
  );

  readonly archeoLayers = computed(() => 
    this._layers().filter(l => l.type === 'archeo')
  );

  readonly totalFeatureCount = computed(() => 
    this._layers().reduce((sum, l) => sum + (l.featureCount || 0), 0)
  );

  // Stockage des couches OpenLayers
  private vectorLayers: Map<string, VectorLayer<VectorSource>> = new Map();
  private baseLayer: TileLayer<any> | null = null;
  private map: OlMap | null = null;

  // ═══════════════════════════════════════════════════════════════
  // Configuration des fonds de carte
  // ═══════════════════════════════════════════════════════════════

  readonly baseMapConfigs: Record<BaseMapType, BaseMapConfig> = {
    'osm': {
      id: 'osm',
      name: 'OpenStreetMap',
      type: 'osm',
      thumbnail: 'assets/img/basemaps/osm.png',
      description: 'Carte collaborative OpenStreetMap'
    },
    'satellite': {
      id: 'satellite',
      name: 'Satellite',
      type: 'satellite',
      thumbnail: 'assets/img/basemaps/satellite.png',
      description: 'Imagerie satellite Google'
    },
    'terrain': {
      id: 'terrain',
      name: 'Terrain',
      type: 'terrain',
      thumbnail: 'assets/img/basemaps/terrain.png',
      description: 'Carte avec relief'
    },
    'ign': {
      id: 'ign',
      name: 'IGN Ortho',
      type: 'ign',
      thumbnail: 'assets/img/basemaps/ign.png',
      description: 'Orthophotos IGN Géoportail'
    },
    'ign-scan25': {
      id: 'ign-scan25',
      name: 'IGN Scan 25',
      type: 'ign-scan25',
      thumbnail: 'assets/img/basemaps/scan25.png',
      description: 'Cartes topographiques IGN'
    },
    'cadastre': {
      id: 'cadastre',
      name: 'Cadastre',
      type: 'cadastre',
      thumbnail: 'assets/img/basemaps/cadastre.png',
      description: 'Plan cadastral français'
    },
    'none': {
      id: 'none',
      name: 'Aucun',
      type: 'none',
      thumbnail: 'assets/img/basemaps/none.png',
      description: 'Pas de fond de carte'
    }
  };

  constructor(
    private styleService: StyleService,
    private gmlParser: GmlParserService
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // Initialisation
  // ═���═════════════════════════════════════════════════════════════

  /**
   * Initialise le service avec une référence à la carte
   */
  setMap(map: OlMap): void {
    this.map = map;
  }

  // ═══════════════════════════════════════════════════════════════
  // Gestion des fonds de carte
  // ═══════════════════════════════════════════════════════════════

  /**
   * Change le fond de carte
   */
  setBaseMap(type: BaseMapType): void {
    if (!this.map) {
      console.error('[LayerService] Carte non initialisée');
      return;
    }

    // Supprimer l'ancien fond de carte
    if (this.baseLayer) {
      this.map.removeLayer(this.baseLayer);
      this.baseLayer = null;
    }

    if (type === 'none') {
      this._currentBaseMap.set('none');
      return;
    }

    const source = this.createBaseMapSource(type);
    if (!source) return;

    this.baseLayer = new TileLayer({
      source,
      properties: { name: type, type: 'base' }
    });

    // Insérer en position 0 (sous les autres couches)
    this.map.getLayers().insertAt(0, this.baseLayer);
    this._currentBaseMap.set(type);

    console.log('[LayerService] Fond de carte changé:', type);
  }

  /**
   * Crée la source pour un type de fond de carte
   */
  private createBaseMapSource(type: BaseMapType): any {
    switch (type) {
      case 'osm':
        return new OSM();

      case 'satellite':
        return new XYZ({
          url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          maxZoom: 20
        });

      case 'terrain':
        return new XYZ({
          url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          maxZoom: 20
        });

      case 'ign':
        return this.createIGNSource('ORTHOIMAGERY.ORTHOPHOTOS');

      case 'ign-scan25':
        return this.createIGNSource('GEOGRAPHICALGRIDSYSTEMS.MAPS');

      case 'cadastre':
        return new XYZ({
          url: 'https://wxs.ign.fr/parcellaire/geoportail/wmts?' +
            'SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
            '&LAYER=CADASTRALPARCELS.PARCELS&STYLE=normal' +
            '&TILEMATRIXSET=PM&FORMAT=image/png' +
            '&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}',
          maxZoom: 20
        });

      default:
        return new OSM();
    }
  }

  /**
   * Crée une source WMTS IGN
   */
  private createIGNSource(layer: string): WMTS | null {
    const projection = getProjection('EPSG:3857');
    if (!projection) return null;

    const projectionExtent = projection.getExtent();
    const size = getWidth(projectionExtent) / 256;
    const resolutions = new Array(19);
    const matrixIds = new Array(19);

    for (let z = 0; z < 19; ++z) {
      resolutions[z] = size / Math.pow(2, z);
      matrixIds[z] = z.toString();
    }

    return new WMTS({
      url: 'https://wxs.ign.fr/decouverte/geoportail/wmts',
      layer: layer,
      matrixSet: 'PM',
      format: 'image/jpeg',
      projection: 'EPSG:3857',
      tileGrid: new WMTSTileGrid({
        origin: getTopLeft(projectionExtent),
        resolutions: resolutions,
        matrixIds: matrixIds
      }),
      style: 'normal'
    });
  }

  /**
   * Retourne les configurations de fonds de carte disponibles
   */
  getAvailableBaseMaps(): BaseMapConfig[] {
    return Object.values(this.baseMapConfigs);
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
    options?: { 
      visible?: boolean; 
      opacity?: number; 
      zIndex?: number;
      groupId?: string;
    }
  ): VectorLayer<VectorSource> | null {
    if (!this.map) {
      console.error('[LayerService] Carte non initialisée');
      return null;
    }

    // Convertir les features en format OpenLayers
    const olFeatures = this.gmlParser.toOpenLayersFeatures(features);
    if (olFeatures.length === 0) {
      console.warn(`[LayerService] Aucune feature valide pour la couche ${layerName}`);
      return null;
    }

    // Créer la source vectorielle
    const source = new VectorSource({ features: olFeatures });

    // Déterminer le type principal pour le style
    const mainType = features[0]?.gmlType || 'default';

    // Créer la couche avec style du StyleService
    const layer = new VectorLayer({
      source,
      style: this.styleService.createStyleFunction(mainType),
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

    this.map.addLayer(layer);
    this.vectorLayers.set(layerId, layer);

    // Créer l'entrée de couche
    const mapLayer: MapLayer = {
      id: layerId,
      name: layerName,
      type: 'archeo',
      visible: options?.visible ?? true,
      opacity: options?.opacity ?? 1,
      zIndex: options?.zIndex ?? 10,
      featureCount: features.length,
      gmlType: mainType,
      color: this.styleService.getColor(mainType),
      groupId: options?.groupId
    };

    this._layers.update(layers => [...layers, mapLayer]);

    console.log(`[LayerService] Couche "${layerName}" ajoutée avec ${features.length} features`);
    return layer;
  }

  /**
   * Supprime une couche
   */
  removeLayer(layerId: string): void {
    const layer = this.vectorLayers.get(layerId);
    if (this.map && layer) {
      this.map.removeLayer(layer);
      this.vectorLayers.delete(layerId);
      this._layers.update(layers => layers.filter(l => l.id !== layerId));
    }
  }

  /**
   * Supprime toutes les couches de données
   */
  clearAllLayers(): void {
    if (!this.map) return;

    this.vectorLayers.forEach((layer) => {
      this.map!.removeLayer(layer);
    });

    this.vectorLayers.clear();
    this._layers.set([]);
    this._layerGroups.set([]);

    console.log('[LayerService] Toutes les couches supprimées');
  }

  // ═══════════════════════════════════════════════════════════════
  // Modification des couches
  // ═══════════════════════════════════════════════════════════════

  /**
   * Définit la visibilité d'une couche
   */
  setLayerVisibility(layerId: string, visible: boolean): void {
    const layer = this.vectorLayers.get(layerId);
    if (layer) {
      layer.setVisible(visible);
      this._layers.update(layers =>
        layers.map(l => l.id === layerId ? { ...l, visible } : l)
      );
    }
  }

  /**
   * Définit l'opacité d'une couche
   */
  setLayerOpacity(layerId: string, opacity: number): void {
    const layer = this.vectorLayers.get(layerId);
    if (layer) {
      layer.setOpacity(opacity);
      this._layers.update(layers =>
        layers.map(l => l.id === layerId ? { ...l, opacity } : l)
      );
    }
  }

  /**
   * Change l'ordre Z d'une couche
   */
  setLayerZIndex(layerId: string, zIndex: number): void {
    const layer = this.vectorLayers.get(layerId);
    if (layer) {
      layer.setZIndex(zIndex);
      this._layers.update(layers =>
        layers.map(l => l.id === layerId ? { ...l, zIndex } : l)
      );
    }
  }

  /**
   * Déplace une couche vers le haut
   */
  moveLayerUp(layerId: string): void {
    const layers = this._layers();
    const index = layers.findIndex(l => l.id === layerId);
    if (index > 0) {
      const newLayers = [...layers];
      [newLayers[index - 1], newLayers[index]] = [newLayers[index], newLayers[index - 1]];
      
      // Mettre à jour les zIndex
      newLayers.forEach((l, i) => {
        l.zIndex = 10 + i;
        const olLayer = this.vectorLayers.get(l.id);
        if (olLayer) olLayer.setZIndex(l.zIndex);
      });
      
      this._layers.set(newLayers);
    }
  }

  /**
   * Déplace une couche vers le bas
   */
  moveLayerDown(layerId: string): void {
    const layers = this._layers();
    const index = layers.findIndex(l => l.id === layerId);
    if (index < layers.length - 1) {
      const newLayers = [...layers];
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      
      newLayers.forEach((l, i) => {
        l.zIndex = 10 + i;
        const olLayer = this.vectorLayers.get(l.id);
        if (olLayer) olLayer.setZIndex(l.zIndex);
      });
      
      this._layers.set(newLayers);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Groupes de couches
  // ═══════════════════════════════════════════════════════════════

  /**
   * Crée un groupe de couches
   */
  createLayerGroup(id: string, name: string, layerIds: string[]): void {
    const group: LayerGroup = {
      id,
      name,
      expanded: true,
      visible: true,
      layerIds
    };

    this._layerGroups.update(groups => [...groups, group]);

    // Associer les couches au groupe
    this._layers.update(layers =>
      layers.map(l => layerIds.includes(l.id) ? { ...l, groupId: id } : l)
    );
  }

  /**
   * Définit la visibilité d'un groupe entier
   */
  setGroupVisibility(groupId: string, visible: boolean): void {
    const group = this._layerGroups().find(g => g.id === groupId);
    if (!group) return;

    group.layerIds.forEach(layerId => {
      this.setLayerVisibility(layerId, visible);
    });

    this._layerGroups.update(groups =>
      groups.map(g => g.id === groupId ? { ...g, visible } : g)
    );
  }

  /**
   * Bascule l'état d'expansion d'un groupe
   */
  toggleGroupExpanded(groupId: string): void {
    this._layerGroups.update(groups =>
      groups.map(g => g.id === groupId ? { ...g, expanded: !g.expanded } : g)
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Utilitaires
  // ═══════════════════════════════════════════════════════════════

  /**
   * Récupère la source d'une couche
   */
  getLayerSource(layerId: string): VectorSource | null {
    const layer = this.vectorLayers.get(layerId);
    return layer?.getSource() || null;
  }

  /**
   * Récupère les features d'une couche
   */
  getLayerFeatures(layerId: string): Feature<Geometry>[] {
    const source = this.getLayerSource(layerId);
    return source?.getFeatures() || [];
  }

  /**
   * Zoom sur l'étendue d'une couche
   */
  zoomToLayer(layerId: string): void {
    const source = this.getLayerSource(layerId);
    if (source && this.map) {
      const extent = source.getExtent();
      if (extent && extent[0] !== Infinity) {
        this.map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 500
        });
      }
    }
  }

  /**
   * Zoom sur toutes les couches
   */
  zoomToAllLayers(): void {
    if (!this.map) return;

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
      this.map.getView().fit(combinedExtent, {
        padding: [50, 50, 50, 50],
        duration: 500
      });
    }
  }

  /**
   * Rafraîchit le style d'une couche
   */
  refreshLayerStyle(layerId: string): void {
    const layer = this.vectorLayers.get(layerId);
    const mapLayer = this._layers().find(l => l.id === layerId);
    
    if (layer && mapLayer?.gmlType) {
      layer.setStyle(this.styleService.createStyleFunction(mapLayer.gmlType));
    }
  }

  /**
   * Rafraîchit le style de toutes les couches
   */
  refreshAllStyles(): void {
    this._layers().forEach(l => {
      if (l.gmlType) {
        this.refreshLayerStyle(l.id);
      }
    });
  }
}