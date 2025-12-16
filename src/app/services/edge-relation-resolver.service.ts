import { Injectable } from '@angular/core';
import { ApiStratigraphie } from '../../../shared';
import { WorkerService } from './worker.service';

export interface EdgeIdentifier {
  sourceNodeId: string;
  targetNodeId:  string;
  sourceUuid: string;
  targetUuid: string;
  sourceType: 'us' | 'fait';
  targetType:  'us' | 'fait';
}

export interface ResolvedRelation {
  relation: ApiStratigraphie;
  edgeIdentifier: EdgeIdentifier;
}

@Injectable({
  providedIn: 'root'
})
export class EdgeRelationResolverService {

  private relationsCache: ApiStratigraphie[] = [];

  constructor(private w: WorkerService) {}

  updateRelationsCache(relations:  ApiStratigraphie[]): void {
    this.relationsCache = relations. filter(r => r. live);
    console.log(`[EdgeRelationResolver] Cache updated:  ${this.relationsCache.length} relations`);
  }

  sanitizedIdToUuid(sanitizedId: string): string {
    const withoutPrefix = sanitizedId. replace(/^node_/, '');
    return withoutPrefix.replace(/_/g, '-');
  }

  getEntityType(uuid: string): 'us' | 'fait' | null {
    const us = this.w.data().objects. us. all. findByUuid(uuid);
    if (us) return 'us';

    const fait = this.w.data().objects.fait.all.findByUuid(uuid);
    if (fait) return 'fait';

    return null;
  }

  /**
   * Extrait les identifiants depuis l'élément passé
   * accepte directement un path OU cherche à l'intérieur
   */
  extractEdgeIdentifier(element: Element): EdgeIdentifier | null {
    console.group('[EdgeRelationResolver] Extracting edge identifier');

    try {
      // Déterminer si l'élément est déjà un path ou s'il faut chercher dedans
      let pathElement:  Element | null = null;
      
      if (element.tagName.toLowerCase() === 'path') {
        // L'élément passé EST le path
        pathElement = element;
        console.log('Element is already a path');
      } else {
        // Chercher un path à l'intérieur (fallback)
        pathElement = element.querySelector('path[class*="LS-"]');
        console.log('Searching for path inside element');
      }

      if (!pathElement) {
        console.error('No path element found');
        console.groupEnd();
        return null;
      }

      const classAttr = pathElement. getAttribute('class') || '';
      console.log('Path classes:', classAttr);

      // Extraire LS-node_xxx (Link Source)
      const sourceMatch = classAttr. match(/LS-(node_[a-f0-9_]+)/i);
      // Extraire LE-node_xxx (Link End)
      const targetMatch = classAttr.match(/LE-(node_[a-f0-9_]+)/i);

      if (! sourceMatch) {
        console. error('Could not find LS- class in:', classAttr);
        console.groupEnd();
        return null;
      }

      if (!targetMatch) {
        console.error('Could not find LE- class in:', classAttr);
        console.groupEnd();
        return null;
      }

      const sourceNodeId = sourceMatch[1];
      const targetNodeId = targetMatch[1];

      console.log('Source node ID:', sourceNodeId);
      console.log('Target node ID:', targetNodeId);

      const sourceUuid = this.sanitizedIdToUuid(sourceNodeId);
      const targetUuid = this.sanitizedIdToUuid(targetNodeId);

      console.log('Source UUID:', sourceUuid);
      console.log('Target UUID:', targetUuid);

      const sourceType = this. getEntityType(sourceUuid);
      const targetType = this.getEntityType(targetUuid);

      console.log('Source type:', sourceType);
      console.log('Target type:', targetType);

      if (! sourceType || !targetType) {
        console.error('Could not determine entity types');
        console.groupEnd();
        return null;
      }

      const result: EdgeIdentifier = {
        sourceNodeId,
        targetNodeId,
        sourceUuid,
        targetUuid,
        sourceType,
        targetType
      };

      console.log('Successfully extracted:', result);
      console.groupEnd();
      return result;

    } catch (error) {
      console.error('Error extracting edge identifier:', error);
      console.groupEnd();
      return null;
    }
  }

  findRelation(
    sourceUuid: string,
    targetUuid: string,
    sourceType: 'us' | 'fait',
    targetType: 'us' | 'fait'
  ): ApiStratigraphie | null {

    console.log(`[EdgeRelationResolver] Finding relation:  ${sourceType}: ${sourceUuid} → ${targetType}: ${targetUuid}`);

    // Recherche directe
    let relation = this.relationsCache.find(rel => {
      const sourceMatch = this.matchesSource(rel, sourceUuid, sourceType);
      const targetMatch = this.matchesTarget(rel, targetUuid, targetType);
      return sourceMatch && targetMatch;
    });

    if (relation) {
      console.log(`Found relation: ${relation.stratigraphie_uuid}`);
      return relation;
    }

    // Essayer l'inverse (pour les contemporains)
    relation = this.relationsCache.find(rel => {
      if (! rel.is_contemporain) return false;
      const sourceMatch = this. matchesSource(rel, targetUuid, targetType);
      const targetMatch = this. matchesTarget(rel, sourceUuid, sourceType);
      return sourceMatch && targetMatch;
    });

    if (relation) {
      console.log(`Found inverse relation (contemporain): ${relation.stratigraphie_uuid}`);
      return relation;
    }

    console.warn(`No relation found`);
    this.debugPrintRelationsForEntities(sourceUuid, targetUuid);
    return null;
  }

  private matchesSource(rel: ApiStratigraphie, uuid: string, type: 'us' | 'fait'): boolean {
    if (type === 'us') {
      return rel.us_anterieur === uuid;
    }
    return rel.fait_anterieur === uuid;
  }

  private matchesTarget(rel: ApiStratigraphie, uuid: string, type:  'us' | 'fait'): boolean {
    if (type === 'us') {
      return rel.us_posterieur === uuid;
    }
    return rel.fait_posterieur === uuid;
  }

  resolveEdgeToRelation(element: Element): ResolvedRelation | null {
    const edgeIdentifier = this.extractEdgeIdentifier(element);
    if (!edgeIdentifier) {
      return null;
    }

    const relation = this.findRelation(
      edgeIdentifier.sourceUuid,
      edgeIdentifier.targetUuid,
      edgeIdentifier. sourceType,
      edgeIdentifier. targetType
    );

    if (!relation) {
      return null;
    }

    return { relation, edgeIdentifier };
  }

  private debugPrintRelationsForEntities(uuid1: string, uuid2: string): void {
    console. group('[EdgeRelationResolver] Relations involving these entities:');
    
    const relevant = this.relationsCache.filter(rel => {
      return rel.us_anterieur === uuid1 || rel. us_posterieur === uuid1 ||
             rel.fait_anterieur === uuid1 || rel. fait_posterieur === uuid1 ||
             rel. us_anterieur === uuid2 || rel.us_posterieur === uuid2 ||
             rel.fait_anterieur === uuid2 || rel. fait_posterieur === uuid2;
    });

    if (relevant.length === 0) {
      console.log('No relations found for these entities');
    } else {
      relevant.forEach(rel => {
        const ant = rel.us_anterieur || rel. fait_anterieur;
        const post = rel.us_posterieur || rel. fait_posterieur;
        console.log(`  ${rel.stratigraphie_uuid}: ${ant} → ${post} (contemporain: ${rel. is_contemporain})`);
      });
    }

    console.groupEnd();
  }

  debugResolveEdge(element: Element): void {
    console.group('[EdgeRelationResolver] Debug Resolution');
    console.log('Element tag:', element.tagName);
    console.log('Element classes:', element.getAttribute('class'));
    
    const identifier = this.extractEdgeIdentifier(element);
    console.log('Extracted identifier:', identifier);

    if (identifier) {
      const relation = this.findRelation(
        identifier.sourceUuid,
        identifier. targetUuid,
        identifier.sourceType,
        identifier. targetType
      );
      console.log('Found relation:', relation);
    }

    console.groupEnd();
  }
}