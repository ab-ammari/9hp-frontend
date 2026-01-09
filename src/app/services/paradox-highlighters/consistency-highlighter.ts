import { ParadoxHighlighter, ParadoxHighlight } from './paradox-highlighter.base';
import { DetectedParadox } from '../castor-validation.service';

export class ConsistencyHighlighter extends ParadoxHighlighter {
  
  buildHighlight(paradox: DetectedParadox, colorIndex: number): ParadoxHighlight {
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    const processedRelations: any[] = [];
    
    console.log(`[ConsistencyHighlighter] Processing consistency paradox`);
    
    // Extraire toutes les entités (principalement des Faits)
    paradox.relations.forEach(relation => {
      // Collecter tous les Faits
      const faits = [
        relation.fait_anterieur,
        relation.fait_posterieur
      ].filter(uuid => uuid !== null && uuid !== undefined);
      
      // Ajouter aussi les US impliquées
      const us = [
        relation.us_anterieur,
        relation.us_posterieur
      ].filter(uuid => uuid !== null && uuid !== undefined);
      
      [...faits, ...us].forEach(uuid => {
        nodeIds.add(this.sanitizeId(uuid));
      });
      
      processedRelations.push(relation);
    });
    
    return {
      paradoxId: `consistency_${Date.now()}_${colorIndex}`,
      type: 'consistency',
      nodeIds,
      edgeIds,
      relations: processedRelations,
      colorIndex,
      priority: this.getPriority(),
      displayName: `Incohérence ${colorIndex + 1}`,
      shortMessage: paradox.shortMessage || paradox.message,
      metadata: {
        originalMessage: paradox.message,
        type: 'consistency'
      }
    };
  }
  
  getCSSClasses(): string[] {
    return ['paradox-edge-consistency', 'paradox-node-consistency'];
  }
  
  getDisplayName(): string {
    return 'Cohérence';
  }
  
  getPriority(): number {
    return 3;
  }
}