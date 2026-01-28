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
  },
  'EPSG:3946': {
    name: 'RGF93 / CC46 (France zone 46)',
    def: '+proj=lcc +lat_1=45.25 +lat_2=46.75 +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
  },
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
  * Ordre des tests : du plus spécifique au plus général pour éviter les fausses détections
  */
  detectCRS(x: number, y: number): string {
    // WGS84 (coordonnées géographiques) - Test en premier car bornes très spécifiques
    if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
      return 'EPSG:4326';
    }
    
    // Lambert 93 (système officiel France métropolitaine)
    // X: 100 000 à 1 300 000, Y: 6 000 000 à 7 200 000
    if (x >= 100000 && x <= 1300000 && y >= 6000000 && y <= 7300000) {
      return 'EPSG:2154';
    }
    
    // Lambert CC Zone 42 (Corse) - EPSG:3942
    if (x >= 1100000 && x <= 1300000 && y >= 4600000 && y <= 4900000) {
      return 'EPSG:3942';
    }
    
    // Lambert CC Zone 43 (Sud-Est) - EPSG:3943  
    if (x >= 1200000 && x <= 1400000 && y >= 4800000 && y <= 5100000) {
      return 'EPSG:3943';
    }
    
    // Lambert CC Zone 44 (Sud) - EPSG:3944
    if (x >= 1300000 && x <= 1500000 && y >= 4900000 && y <= 5200000) {
      return 'EPSG:3944';
    }
    
    // Lambert CC Zone 45 (Centre-Sud) - EPSG:3945
    if (x >= 1400000 && x <= 1600000 && y >= 5000000 && y <= 5300000) {
      return 'EPSG:3945';
    }
    
    // Lambert CC Zone 46 (Centre) - EPSG:3946
    // Bornes ajustées selon vos exemples
    if (x >= 1500000 && x <= 1900000 && y >= 5100000 && y <= 5400000) {
      return 'EPSG:3946';
    }
    
    // Lambert CC Zone 47 (Centre-Nord) - EPSG:3947
    if (x >= 1600000 && x <= 2000000 && y >= 5200000 && y <= 5500000) {
      return 'EPSG:3947';
    }
    
    // Lambert CC Zone 48 (Nord) - EPSG:3948
    if (x >= 1700000 && x <= 2100000 && y >= 5300000 && y <= 5600000) {
      return 'EPSG:3948';
    }
    
    // Lambert CC Zone 49 (Nord-Est) - EPSG:3949
    if (x >= 1800000 && x <= 2200000 && y >= 5400000 && y <= 5700000) {
      return 'EPSG:3949';
    }
    
    // Lambert CC Zone 50 (Est) - EPSG:3950
    if (x >= 1900000 && x <= 2300000 && y >= 5500000 && y <= 5800000) {
      return 'EPSG:3950';
    }
    
    // UTM Zone 31N (Sud-Ouest France) - EPSG:32631
    // X: 166 000 à 833 000, Y: 4 000 000 à 5 500 000 pour la France
    if (x >= 166000 && x <= 833000 && y >= 4000000 && y <= 5500000) {
      return 'EPSG:32631';
    }
    
    // UTM Zone 32N (Est France) - EPSG:32632
    // X: 166 000 à 833 000, Y: 4 600 000 à 5 500 000 pour la France Est
    if (x >= 166000 && x <= 833000 && y >= 4600000 && y <= 5500000) {
      return 'EPSG:32632';
    }
    
    // Web Mercator par défaut (Google Maps, OSM, etc.)
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
