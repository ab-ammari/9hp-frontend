import { ParadoxHighlighter, ParadoxHighlight } from './paradox-highlighter.base';
import { DetectedParadox } from '../castor-validation.service';

export class TemporalHighlighter extends ParadoxHighlighter {
  
  buildHighlight(paradox: DetectedParadox, colorIndex: number): ParadoxHighlight {
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    const processedRelations: any[] = [];
    
    console.log(`[TemporalHighlighter] Processing ${paradox.relations.length} relations`);
    
    // Extraire toutes les entités impliquées
    paradox.relations.forEach(relation => {
      // Collecter tous les UUIDs
      const uuids = [
        relation.us_anterieur,
        relation.us_posterieur,
        relation.fait_anterieur,
        relation.fait_posterieur
      ].filter(uuid => uuid !== null && uuid !== undefined);
      
      // Ajouter les nœuds
      uuids.forEach(uuid => {
        nodeIds.add(this.sanitizeId(uuid));
      });
      
      // Conserver la relation pour traitement dans le service
      processedRelations.push(relation);
    });
    
    return {
      paradoxId: `temporal_${Date.now()}_${colorIndex}`,
      type: 'temporal',
      nodeIds,
      edgeIds, // Les edges seront déterminées dynamiquement
      relations: processedRelations,
      colorIndex,
      priority: this.getPriority(),
      displayName: `Paradoxe temporel ${colorIndex + 1}`,
      shortMessage: paradox.shortMessage || paradox.message,
      metadata: {
        originalMessage: paradox.message,
        type: 'temporal'
      }
    };
  }
  
  getCSSClasses(): string[] {
    return ['paradox-edge-temporal', 'paradox-node-temporal'];
  }
  
  getDisplayName(): string {
    return 'Temporels';
  }
  
  getPriority(): number {
    return 2;
  }
}