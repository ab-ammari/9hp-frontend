import { DetectedParadox, CycleParadox } from '../castor-validation.service';
import { ApiStratigraphie } from '../../../../shared';

export interface ParadoxHighlight {
  paradoxId: string;
  type: 'cycle' | 'temporal' | 'consistency' | 'containment';
  nodeIds: Set<string>;
  edgeIds: Set<string>;
  relations: ApiStratigraphie[];
  colorIndex: number;
  priority: number;
  displayName: string;
  shortMessage?: string;
  metadata?: any;
}

export abstract class ParadoxHighlighter {
  protected readonly colors = [
    '#e91e63',  // Rose
    '#9c27b0',  // Violet
    '#673ab7',  // Violet foncé
    '#3f51b5',  // Indigo
    '#f44336',  // Rouge
    '#ff5722',  // Orange foncé
    '#ff9800',  // Orange
    '#4caf50',  // Vert
  ];

  abstract buildHighlight(paradox: DetectedParadox, colorIndex: number): ParadoxHighlight;
  abstract getCSSClasses(): string[];
  abstract getDisplayName(): string;
  abstract getPriority(): number;
  
  protected sanitizeId(uuid: string): string {
    return 'node_' + uuid.replace(/-/g, '_');
  }
  
  protected extractNodesFromRelation(relation: ApiStratigraphie): Set<string> {
    const nodes = new Set<string>();
    if (relation.us_anterieur) nodes.add(this.sanitizeId(relation.us_anterieur));
    if (relation.us_posterieur) nodes.add(this.sanitizeId(relation.us_posterieur));
    if (relation.fait_anterieur) nodes.add(this.sanitizeId(relation.fait_anterieur));
    if (relation.fait_posterieur) nodes.add(this.sanitizeId(relation.fait_posterieur));
    return nodes;
  }
  
  protected buildEdgeId(source: string, target: string): string {
    return `edge_${source}_${target}`;
  }
}