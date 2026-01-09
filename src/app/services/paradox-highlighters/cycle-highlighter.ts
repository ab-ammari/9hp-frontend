import { ParadoxHighlighter, ParadoxHighlight } from './paradox-highlighter.base';
import { DetectedParadox, CycleParadox } from '../castor-validation.service';

export class CycleHighlighter extends ParadoxHighlighter {
  
  buildHighlight(paradox: DetectedParadox, colorIndex: number): ParadoxHighlight {
    const cycleParadox = paradox as CycleParadox;
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    
    console.log(`[CycleHighlighter] Building highlight for cycle ${cycleParadox.cycleId}`);
    console.log(`[CycleHighlighter] Cycle nodes UUIDs:`, cycleParadox.cycleNodesUUIDs);
    
    // Ajouter tous les nœuds du cycle
    if (cycleParadox.cycleNodesUUIDs && cycleParadox.cycleNodesUUIDs.length > 0) {
      cycleParadox.cycleNodesUUIDs.forEach(uuid => {
        const sanitizedId = this.sanitizeId(uuid);
        nodeIds.add(sanitizedId);
        console.log(`[CycleHighlighter] Added node: ${sanitizedId}`);
      });
      
      // Construire les edges du cycle
      // Note: Les edgeIds ne sont pas utilisés directement car on utilise
      // une méthode spéciale pour les cycles dans le service
      for (let i = 0; i < cycleParadox.cycleNodesUUIDs.length; i++) {
        const currentUuid = cycleParadox.cycleNodesUUIDs[i];
        const nextUuid = cycleParadox.cycleNodesUUIDs[(i + 1) % cycleParadox.cycleNodesUUIDs.length];
        const edgeId = this.buildEdgeId(
          this.sanitizeId(currentUuid),
          this.sanitizeId(nextUuid)
        );
        edgeIds.add(edgeId);
        console.log(`[CycleHighlighter] Added edge: ${edgeId}`);
      }
    }
    
    return {
      paradoxId: cycleParadox.cycleId || `cycle_${Date.now()}_${colorIndex}`,
      type: 'cycle',
      nodeIds,
      edgeIds,
      relations: cycleParadox.allRelations || paradox.relations,
      colorIndex,
      priority: this.getPriority(),
      displayName: `Cycle ${colorIndex + 1}`,
      shortMessage: paradox.shortMessage,
      metadata: {
        cycleNodes: cycleParadox.cycleNodes,
        cycleNodesUUIDs: cycleParadox.cycleNodesUUIDs,
        cycleId: cycleParadox.cycleId
      }
    };
  }
  
  getCSSClasses(): string[] {
    return ['paradox-edge-cycle', 'paradox-node-cycle'];
  }
  
  getDisplayName(): string {
    return 'Cycles';
  }
  
  getPriority(): number {
    return 1; // Plus haute priorité
  }
  
  protected sanitizeId(uuid: string): string {
    // Important: correspondre exactement au format Mermaid
    return 'node_' + uuid.replace(/-/g, '_');
  }
  
  protected buildEdgeId(source: string, target: string): string {
    // Format pour référence interne (pas utilisé directement dans le DOM)
    return `edge_${source}_${target}`;
  }
}