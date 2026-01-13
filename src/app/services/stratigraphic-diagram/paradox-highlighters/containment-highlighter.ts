import { ParadoxHighlighter, ParadoxHighlight } from './paradox-highlighter.base';
import { DetectedParadox } from '../../castor-validation.service';

export class ContainmentHighlighter extends ParadoxHighlighter {
  
  buildHighlight(paradox: DetectedParadox, colorIndex: number): ParadoxHighlight {
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    const processedRelations: any[] = [];
    
    console.log(`[ContainmentHighlighter] Processing containment paradox`);
    
    // Pour les paradoxes de contenance, on veut mettre en évidence
    // le Fait et toutes ses US internes qui posent problème
    paradox.relations.forEach(relation => {
      // Tous les éléments impliqués
      const allEntities = [
        relation.us_anterieur,
        relation.us_posterieur,
        relation.fait_anterieur,
        relation.fait_posterieur
      ].filter(uuid => uuid !== null && uuid !== undefined);
      
      allEntities.forEach(uuid => {
        nodeIds.add(this.sanitizeId(uuid));
      });
      
      processedRelations.push(relation);
    });
    
    return {
      paradoxId: `containment_${Date.now()}_${colorIndex}`,
      type: 'containment',
      nodeIds,
      edgeIds,
      relations: processedRelations,
      colorIndex,
      priority: this.getPriority(),
      displayName: `Contenance ${colorIndex + 1}`,
      shortMessage: paradox.shortMessage || paradox.message,
      metadata: {
        originalMessage: paradox.message,
        type: 'containment'
      }
    };
  }
  
  getCSSClasses(): string[] {
    return ['paradox-edge-containment', 'paradox-node-containment'];
  }
  
  getDisplayName(): string {
    return 'Contenance';
  }
  
  getPriority(): number {
    return 4;
  }
}