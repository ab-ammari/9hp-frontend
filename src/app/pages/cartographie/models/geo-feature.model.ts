/**
 * Module Cartographie - Modèles de données
 */

/**
 * Types de géométrie supportés
 */
export enum GeometryType {
  POINT = 'Point',
  LINESTRING = 'LineString',
  POLYGON = 'Polygon',
  MULTIPOLYGON = 'MultiPolygon'
}

/**
 * Type d'entité archéologique
 */
export enum ArcheoEntityType {
  FAIT = 'fait',
  US = 'us',
  SECTEUR = 'secteur',
  PRELEVEMENT = 'prelevement',
  MOBILIER = 'mobilier',
  TOPO = 'topo',
  PHOTO = 'photo'
}

/**
 * Coordonnée 3D
 */
export interface Coordinate3D {
  x: number;
  y: number;
  z?: number;
}

/**
 * Feature géographique de base
 */
export interface GeoFeature {
  id: string;
  geometryType: GeometryType;
  coordinates: Coordinate3D[] | Coordinate3D[][];

  // Attributs GML
  gmlType: string;
  faitLabel?: string;
  numPoint?: string;
  altitude?: number;

  // Liaison avec entité métier
  entityType?: ArcheoEntityType;
  entityUuid?: string;
  entityData?: any;

  // État d'affichage
  visible: boolean;
  selected: boolean;
  highlighted: boolean;
}

/**
 * Couche cartographique
 */
export interface MapLayer {
  id: string;
  name: string;
  type: 'base' | 'overlay' | 'archeo';
  visible: boolean;
  opacity: number;
  zIndex: number;
  entityType?: ArcheoEntityType;
  featureCount?: number;

  gmlType?: string;
  color?: string;
  groupId?: string;
}

/**
 * Groupe de couches
 */
export interface LayerGroup {
  id: string;
  name: string;
  expanded: boolean;
  visible: boolean;
  layerIds: string[];
}

/**
 * Configuration de la carte
 */
export interface MapConfig {
  crs?: string;
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
}

/**
 * État du curseur
 */
export interface CursorPosition {
  x: number;
  y: number;
  z?: number;
}

/**
 * Types de fonds de carte
 */
export type BaseMapType = 'osm' | 'satellite' | 'terrain' | 'ign' | 'ign-scan25' | 'cadastre' | 'none';

/**
 * Configuration d'un fond de carte
 */
export interface BaseMapConfig {
  id: string;
  name: string;
  type: BaseMapType;
  thumbnail: string;
  description?: string;
}

// ═══════════════════════════════════════════════════════════════
// Interfaces de style
// ═══════════════════════════════════════════════════════════════

/**
 * Configuration de remplissage
 */
export interface FillStyle {
  color: string;
}

/**
 * Configuration de contour
 */
export interface StrokeStyle {
  color: string;
  width?: number;
  lineDash?: number[];
}

/**
 * Configuration de point
 */
export interface PointStyle {
  radius: number;
  color: string;
  shape?: 'circle' | 'square' | 'triangle' | 'diamond' | 'star';
}

/**
 * Style complet d'une couche
 */
export interface LayerStyle {
  fill?: FillStyle;
  stroke?: StrokeStyle;
  point?: PointStyle;
}

/**
 * Configuration de style complète
 */
export interface StyleConfig {
  default: LayerStyle;
  selected: LayerStyle;
  highlighted: LayerStyle;
}
