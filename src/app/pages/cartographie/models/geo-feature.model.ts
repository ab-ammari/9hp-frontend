/**
 * Module Cartographie - Modèles de données
 * Phase 1 : Fondations
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
export type BaseMapType = 'osm' | 'satellite' | 'terrain' | 'ign' | 'none';
