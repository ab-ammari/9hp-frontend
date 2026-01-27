import { Injectable } from '@angular/core';
import { Feature } from 'ol';
import { Geometry, Point, Polygon, LineString } from 'ol/geom';
import { GeoFeature, GeometryType, Coordinate3D, ArcheoEntityType } from '../models/geo-feature.model';

@Injectable({
  providedIn: 'root'
})
export class GmlParserService {

  /**
   * Mapping des types GML vers les types d'entités archéologiques
   */
  private readonly typeMapping: Record<string, ArcheoEntityType> = {
    'Fosses': ArcheoEntityType.FAIT,
    'Fosses circulaires': ArcheoEntityType.FAIT,
    'Trous de poteau': ArcheoEntityType.FAIT,
    'Murs': ArcheoEntityType.FAIT,
    'Fossés': ArcheoEntityType.FAIT,
    'Structures': ArcheoEntityType.FAIT,
    'US': ArcheoEntityType.US,
    'US positives': ArcheoEntityType.US,
    'US négatives': ArcheoEntityType.US,
    'Secteurs': ArcheoEntityType.SECTEUR,
    'Points Topo': ArcheoEntityType.TOPO,
    'Prélèvements': ArcheoEntityType.PRELEVEMENT,
    'Mobilier': ArcheoEntityType.MOBILIER,
    'Photos': ArcheoEntityType.PHOTO
  };

  constructor() { }

  /**
   * Parse un fichier GML et retourne les features
   */
  parseGML(gmlContent: string): GeoFeature[] {
    const features: GeoFeature[] = [];

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(gmlContent, 'text/xml');

      // Vérifier les erreurs de parsing
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        console.error('[GmlParserService] Erreur de parsing XML:', parseError.textContent);
        return [];
      }

      // Récupérer tous les featureMembers
      const featureMembers = xmlDoc.getElementsByTagName('gml:featureMember');
      console.log(`[GmlParserService] ${featureMembers.length} featureMembers trouvés`);

      for (let i = 0; i < featureMembers.length; i++) {
        const member = featureMembers[i];
        const feature = this.parseFeatureMember(member);
        if (feature) {
          features.push(feature);
        }
      }

      console.log(`[GmlParserService] ${features.length} features parsées avec succès`);

    } catch (error) {
      console.error('[GmlParserService] Erreur lors du parsing GML:', error);
    }

    return features;
  }

  /**
   * Parse un featureMember individuel
   */
  private parseFeatureMember(member: Element): GeoFeature | null {
    // Détecter le type (Polygones ou Points)
    const polygone = member.getElementsByTagName('ogr:Polygones')[0];
    const point = member.getElementsByTagName('ogr:Points')[0];
    const lineString = member.getElementsByTagName('ogr:Lines')[0];

    const element = polygone || point || lineString;
    if (!element) {
      return null;
    }

    const fid = element.getAttribute('fid') || `feature_${Date.now()}_${Math.random()}`;

    // Extraire les attributs
    const gmlType = this.getTextContent(element, 'ogr:Type') || 'Unknown';
    const faitLabel = this.getTextContent(element, 'ogr:Fait');
    const numPoint = this.getTextContent(element, 'ogr:Numpoint');
    const altitudeStr = this.getTextContent(element, 'ogr:Altitude');

    // Parser l'altitude (format "214,71" avec virgule française)
    const altitude = altitudeStr
      ? parseFloat(altitudeStr.replace(',', '.'))
      : undefined;

    // Extraire la géométrie
    const geometry = this.parseGeometry(element);
    if (!geometry) {
      return null;
    }

    // Déterminer le type d'entité
    const entityType = this.typeMapping[gmlType] || undefined;

    return {
      id: fid,
      geometryType: geometry.type,
      coordinates: geometry.coordinates,
      gmlType,
      faitLabel: faitLabel || undefined,
      numPoint: numPoint || undefined,
      altitude,
      entityType,
      visible: true,
      selected: false,
      highlighted: false
    };
  }

  /**
   * Parse la géométrie d'un élément
   */
  private parseGeometry(element: Element): {
    type: GeometryType;
    coordinates: Coordinate3D[] | Coordinate3D[][]
  } | null {

    // Point
    const pointEl = element.getElementsByTagName('gml:Point')[0];
    if (pointEl) {
      const coords = this.parseCoordinates(pointEl);
      if (coords.length > 0) {
        return { type: GeometryType.POINT, coordinates: coords };
      }
    }

    // Polygon
    const polygonEl = element.getElementsByTagName('gml:Polygon')[0];
    if (polygonEl) {
      const outerRing = polygonEl.getElementsByTagName('gml:LinearRing')[0];
      if (outerRing) {
        const coords = this.parseCoordinates(outerRing);
        if (coords.length > 0) {
          return { type: GeometryType.POLYGON, coordinates: [coords] };
        }
      }
    }

    // LineString
    const lineEl = element.getElementsByTagName('gml:LineString')[0];
    if (lineEl) {
      const coords = this.parseCoordinates(lineEl);
      if (coords.length > 0) {
        return { type: GeometryType.LINESTRING, coordinates: coords };
      }
    }

    return null;
  }

  /**
   * Parse les coordonnées GML
   * Format: "x1,y1 x2,y2 x3,y3 ..." ou "x1,y1,z1 x2,y2,z2 ..."
   */
  private parseCoordinates(element: Element): Coordinate3D[] {
    const coordsEl = element.getElementsByTagName('gml:coordinates')[0];
    if (!coordsEl || !coordsEl.textContent) {
      return [];
    }

    const coordsText = coordsEl.textContent.trim();
    const coordPairs = coordsText.split(/\s+/);

    return coordPairs
      .filter(pair => pair.length > 0)
      .map(pair => {
        const parts = pair.split(',');
        return {
          x: parseFloat(parts[0]),
          y: parseFloat(parts[1]),
          z: parts[2] ? parseFloat(parts[2]) : undefined
        };
      })
      .filter(coord => !isNaN(coord.x) && !isNaN(coord.y));
  }

  /**
   * Utilitaire pour extraire le contenu texte d'un élément
   */
  private getTextContent(parent: Element, tagName: string): string | null {
    const el = parent.getElementsByTagName(tagName)[0];
    return el?.textContent?.trim() || null;
  }

  /**
   * Convertit les GeoFeatures en Features OpenLayers
   */
  toOpenLayersFeatures(geoFeatures: GeoFeature[]): Feature<Geometry>[] {
    return geoFeatures.map(gf => this.geoFeatureToOlFeature(gf)).filter(f => f !== null) as Feature<Geometry>[];
  }

  /**
   * Convertit une GeoFeature en Feature OpenLayers
   */
  geoFeatureToOlFeature(gf: GeoFeature): Feature<Geometry> | null {
    try {
      let geometry: Geometry;

      switch (gf.geometryType) {
        case GeometryType.POINT:
          const pt = gf.coordinates[0] as Coordinate3D;
          geometry = new Point([pt.x, pt.y]);
          break;

        case GeometryType.POLYGON:
          const rings = gf.coordinates as Coordinate3D[][];
          const olRings = rings.map(ring =>
            ring.map(c => [c.x, c.y])
          );
          geometry = new Polygon(olRings);
          break;

        case GeometryType.LINESTRING:
          const lineCoords = (gf.coordinates as Coordinate3D[])
            .map(c => [c.x, c.y]);
          geometry = new LineString(lineCoords);
          break;

        default:
          console.warn(`[GmlParserService] Type de géométrie non supporté: ${gf.geometryType}`);
          return null;
      }

      const feature = new Feature({ geometry });
      feature.setId(gf.id);
      feature.setProperties({
        gmlType: gf.gmlType,
        faitLabel: gf.faitLabel,
        numPoint: gf.numPoint,
        altitude: gf.altitude,
        entityType: gf.entityType,
        entityUuid: gf.entityUuid
      });

      return feature;

    } catch (error) {
      console.error(`[GmlParserService] Erreur de conversion feature ${gf.id}:`, error);
      return null;
    }
  }

  /**
   * Groupe les features par type GML
   */
  groupByType(features: GeoFeature[]): Record<string, GeoFeature[]> {
    return features.reduce((acc, f) => {
      const type = f.gmlType || 'Autres';
      if (!acc[type]) acc[type] = [];
      acc[type].push(f);
      return acc;
    }, {} as Record<string, GeoFeature[]>);
  }

  /**
   * Calcule l'étendue (bounding box) des features
   */
  calculateExtent(features: GeoFeature[]): [number, number, number, number] | null {
    if (features.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    features.forEach(f => {
      const coords = Array.isArray(f.coordinates[0]) && Array.isArray((f.coordinates[0] as any)[0])
        ? (f.coordinates as Coordinate3D[][]).flat()
        : f.coordinates as Coordinate3D[];

      coords.forEach(c => {
        if (c.x < minX) minX = c.x;
        if (c.y < minY) minY = c.y;
        if (c.x > maxX) maxX = c.x;
        if (c.y > maxY) maxY = c.y;
      });
    });

    return [minX, minY, maxX, maxY];
  }
}
