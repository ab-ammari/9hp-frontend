import { Injectable } from '@angular/core';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { get as getProjection } from 'ol/proj';

/**
 * Projections supportées avec leurs définitions Proj4
 */
export const PROJECTIONS: Record<string, { name: string; def: string }> = {
  'EPSG:2154': {
    name: 'RGF93 / Lambert 93 (France)',
    def: '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
  },
  'EPSG:4326': {
    name: 'WGS 84 (GPS)',
    def: '+proj=longlat +datum=WGS84 +no_defs'
  },
  'EPSG:3857': {
    name: 'Web Mercator',
    def: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs'
  },
  'EPSG:32631': {
    name: 'UTM Zone 31N',
    def: '+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs'
  }
};

@Injectable({
  providedIn: 'root'
})
export class ProjectionService {

  private currentCRS = 'EPSG:2154';
  private initialized = false;

  constructor() {
    this.registerProjections();
  }

  /**
   * Enregistre toutes les projections dans Proj4 et OpenLayers
   */
  private registerProjections(): void {
    if (this.initialized) return;

    Object.entries(PROJECTIONS).forEach(([code, { def }]) => {
      if (!proj4.defs(code)) {
        proj4.defs(code, def);
      }
    });

    register(proj4);
    this.initialized = true;

    console.log('[ProjectionService] Projections enregistrées:', Object.keys(PROJECTIONS));
  }

  /**
   * Vérifie qu'une projection est disponible
   */
  isProjectionAvailable(code: string): boolean {
    return getProjection(code) !== null;
  }

  /**
   * Transforme des coordonnées d'un CRS vers un autre
   */
  transform(coords: [number, number], from: string, to: string): [number, number] {
    try {
      return proj4(from, to, coords) as [number, number];
    } catch (error) {
      console.error(`[ProjectionService] Erreur de transformation ${from} -> ${to}:`, error);
      return coords;
    }
  }

  /**
   * Transforme un tableau de coordonnées
   */
  transformCoordinates(
    coords: [number, number][],
    from: string,
    to: string
  ): [number, number][] {
    return coords.map(c => this.transform(c, from, to));
  }

  /**
   * Détecte le CRS probable à partir des coordonnées
   */
  detectCRS(x: number, y: number): string {
    // Lambert 93 : X entre 100 000 et 1 300 000, Y entre 6 000 000 et 7 200 000
    if (x > 100000 && x < 1300000 && y > 6000000 && y < 7300000) {
      return 'EPSG:2154';
    }
    // UTM Zone 31N
    if (x > 100000 && x < 900000 && y > 0 && y < 10000000) {
      return 'EPSG:32631';
    }
    // WGS84
    if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
      return 'EPSG:4326';
    }
    return 'EPSG:3857';
  }

  /**
   * Retourne le CRS courant
   */
  getCurrentCRS(): string {
    return this.currentCRS;
  }

  /**
   * Définit le CRS courant
   */
  setCurrentCRS(crs: string): void {
    if (PROJECTIONS[crs]) {
      this.currentCRS = crs;
      console.log('[ProjectionService] CRS défini:', crs);
    } else {
      console.warn(`[ProjectionService] CRS ${crs} non supporté`);
    }
  }

  /**
   * Liste des CRS disponibles
   */
  getAvailableCRS(): { code: string; name: string }[] {
    return Object.entries(PROJECTIONS).map(([code, { name }]) => ({ code, name }));
  }

  /**
   * Retourne le nom d'un CRS
   */
  getCRSName(code: string): string {
    return PROJECTIONS[code]?.name || code;
  }
}
