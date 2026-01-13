import { ParadoxHighlighter, ParadoxHighlight } from './paradox-highlighter.base';
import { DetectedParadox, CycleParadox, CycleNodeInfo } from '../../castor-validation.service';

export class CycleHighlighter extends ParadoxHighlighter {
  
  buildHighlight(paradox: DetectedParadox, colorIndex: number): ParadoxHighlight {
    const cycleParadox = paradox as CycleParadox;
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    
    // Détecter si c'est un cycle indirect
    const isIndirectCycle = cycleParadox.isIndirectCycle === true;
    const cycleNodeInfos = cycleParadox.cycleNodeInfos || [];
    
    console.log(`[CycleHighlighter] Building highlight for cycle ${cycleParadox.cycleId}`);
    console.log(`[CycleHighlighter] Is indirect: ${isIndirectCycle}`);
    console.log(`[CycleHighlighter] Cycle nodes UUIDs:`, cycleParadox.cycleNodesUUIDs);
    console.log(`[CycleHighlighter] Cycle node infos:`, cycleNodeInfos);
    console.log(`[CycleHighlighter] All relations count:`, cycleParadox.allRelations?.length || 0);
    
    if (isIndirectCycle && cycleNodeInfos.length > 0) {
      // === CYCLE INDIRECT ===
      // Ajouter tous les membres de tous les groupes + entités individuelles
      cycleNodeInfos.forEach(nodeInfo => {
        if (nodeInfo.isGroup && nodeInfo.memberUUIDs) {
          // C'est un groupe : ajouter tous les membres
          nodeInfo.memberUUIDs.forEach(memberUuid => {
            const sanitizedId = this.sanitizeId(memberUuid);
            nodeIds.add(sanitizedId);
            console.log(`[CycleHighlighter] Added group member node: ${sanitizedId}`);
          });
        } else if (nodeInfo.memberUUIDs && nodeInfo.memberUUIDs.length === 1) {
          // Entité individuelle
          const sanitizedId = this.sanitizeId(nodeInfo.memberUUIDs[0]);
          nodeIds.add(sanitizedId);
          console.log(`[CycleHighlighter] Added individual node: ${sanitizedId}`);
        }
      });
      
    } else {
      // === CYCLE DIRECT ===
      // Comportement existant
      if (cycleParadox.cycleNodesUUIDs && cycleParadox.cycleNodesUUIDs.length > 0) {
        cycleParadox.cycleNodesUUIDs.forEach(uuid => {
          const sanitizedId = this.sanitizeId(uuid);
          nodeIds.add(sanitizedId);
          console.log(`[CycleHighlighter] Added node: ${sanitizedId}`);
        });
        
        // Construire les edges du cycle direct
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
    }
    
    // Construire le displayName
    let displayName = `Cycle ${colorIndex + 1}`;
    if (isIndirectCycle) {
      displayName = `Cycle indirect ${colorIndex + 1}`;
    }
    
    return {
      paradoxId: cycleParadox.cycleId || `cycle_${Date.now()}_${colorIndex}`,
      type: 'cycle',
      nodeIds,
      edgeIds,
      relations: cycleParadox.allRelations || paradox.relations,
      colorIndex,
      priority: this.getPriority(),
      displayName,
      shortMessage: paradox.shortMessage,
      metadata: {
        cycleNodes: cycleParadox.cycleNodes,
        cycleNodesUUIDs: cycleParadox.cycleNodesUUIDs,
        cycleId: cycleParadox.cycleId,
        isIndirectCycle: isIndirectCycle,
        cycleNodeInfos: cycleNodeInfos,
        contemporaryGroups: cycleNodeInfos
          .filter(info => info.isGroup && info.memberUUIDs && info.memberUUIDs.length > 1)
          .map(info => ({
            displayTag: info.displayTag,
            memberUUIDs: info.memberUUIDs
          }))
      }
    };
  }
  
  getCSSClasses(): string[] {
    return ['paradox-edge-cycle', 'paradox-node-cycle', 'paradox-subgraph-cycle'];
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