import { Injectable } from '@angular/core';
import { WorkerService } from './worker.service';
import { ApiStratigraphie, ApiDbTable } from '../../../shared';
import mermaid from 'mermaid';

export interface DiagramNode {
  id: string;
  label: string;
  type: 'us' | 'fait';
  uuid: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
  type: 'anterieur' | 'posterieur' | 'contemporain';
  relation: ApiStratigraphie;
}

export interface DiagramConfig {
  includeUS: boolean;
  includeFaits: boolean;
  includeContemporaryRelations: boolean;
  includeContainmentRelations?: boolean;
  maxDepth?: number;
  focusNode?: string;
  highlightCycles?: boolean;
  groupContemporaries?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StratigraphicDiagramService {

  constructor(private w: WorkerService) {
    // Configuration Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        rankSpacing: 30,
        nodeSpacing: 30,
        padding: 15
      },
      securityLevel: 'loose'
    });
  }

  /**
   * Génère le code Mermaid pour un diagramme stratigraphique
   */
  public generateMermaidCode(
    relations: ApiStratigraphie[],
    config: DiagramConfig = { includeUS: true, includeFaits: true, includeContemporaryRelations: true }
  ): string {
    const nodes = this.extractNodes(relations, config);
    const edges = this.extractEdges(relations, config);

    // Filtrer par profondeur si spécifié
    let filteredNodes = nodes;
    let filteredEdges = edges;

    if (config.focusNode && config.maxDepth !== undefined) {
      const subgraph = this.extractSubgraph(config.focusNode, nodes, edges, config.maxDepth);
      filteredNodes = subgraph.nodes;
      filteredEdges = subgraph.edges;
    }

    return this.buildMermaidDiagram(filteredNodes, filteredEdges, config);
  }

  /**
   * Extrait les nœuds (US et Faits) des relations
   */
  private extractNodes(relations: ApiStratigraphie[], config: DiagramConfig): DiagramNode[] {
    const nodesMap = new Map<string, DiagramNode>();

    relations.forEach(rel => {
      if (!rel.live) return;

      // Ajouter les US
      if (config.includeUS) {
        if (rel.us_anterieur) {
          const us = this.w.data().objects.us.all.findByUuid(rel.us_anterieur);
          if (us) {
            nodesMap.set(rel.us_anterieur, {
              id: this.sanitizeId(rel.us_anterieur),
              label: us.item.tag || rel.us_anterieur.substring(0, 8),
              type: 'us',
              uuid: rel.us_anterieur
            });
          }
        }

        if (rel.us_posterieur) {
          const us = this.w.data().objects.us.all.findByUuid(rel.us_posterieur);
          if (us) {
            nodesMap.set(rel.us_posterieur, {
              id: this.sanitizeId(rel.us_posterieur),
              label: us.item.tag || rel.us_posterieur.substring(0, 8),
              type: 'us',
              uuid: rel.us_posterieur
            });
          }
        }
      }

      // Ajouter les Faits
      if (config.includeFaits) {
        if (rel.fait_anterieur) {
          const fait = this.w.data().objects.fait.all.findByUuid(rel.fait_anterieur);
          if (fait) {
            nodesMap.set(rel.fait_anterieur, {
              id: this.sanitizeId(rel.fait_anterieur),
              label: fait.item.tag || rel.fait_anterieur.substring(0, 8),
              type: 'fait',
              uuid: rel.fait_anterieur
            });
          }
        }

        if (rel.fait_posterieur) {
          const fait = this.w.data().objects.fait.all.findByUuid(rel.fait_posterieur);
          if (fait) {
            nodesMap.set(rel.fait_posterieur, {
              id: this.sanitizeId(rel.fait_posterieur),
              label: fait.item.tag || rel.fait_posterieur.substring(0, 8),
              type: 'fait',
              uuid: rel.fait_posterieur
            });
          }
        }
      }
    });

    return Array.from(nodesMap.values());
  }

  /**
   * Extrait les arêtes des relations
   */
  private extractEdges(relations: ApiStratigraphie[], config: DiagramConfig): DiagramEdge[] {
    const edges: DiagramEdge[] = [];

    relations.forEach(rel => {
      if (!rel.live) return;

      // Ignorer les relations contemporaines si non configuré
      if (rel.is_contemporain && !config.includeContemporaryRelations) {
        return;
      }

      let from: string | null = null;
      let to: string | null = null;

      // Déterminer les nœuds source et destination
      if (rel.us_posterieur && config.includeUS) {
        from = rel.us_posterieur;
      } else if (rel.fait_posterieur && config.includeFaits) {
        from = rel.fait_posterieur;
      }

      if (rel.us_anterieur && config.includeUS) {
        to = rel.us_anterieur;
      } else if (rel.fait_anterieur && config.includeFaits) {
        to = rel.fait_anterieur;
      }

      if (from && to) {
        edges.push({
          from: this.sanitizeId(from),
          to: this.sanitizeId(to),
          type: rel.is_contemporain ? 'contemporain' : 'anterieur',
          relation: rel
        });
      }
    });

    return edges;
  }

  /**
   * Extrait un sous-graphe centré sur un nœud avec profondeur limitée
   */
  private extractSubgraph(
    focusNodeUuid: string,
    allNodes: DiagramNode[],
    allEdges: DiagramEdge[],
    maxDepth: number
  ): { nodes: DiagramNode[], edges: DiagramEdge[] } {
    const focusId = this.sanitizeId(focusNodeUuid);
    const includedNodeIds = new Set<string>([focusId]);
    const includedEdges: DiagramEdge[] = [];

    // BFS pour trouver les nœuds à distance <= maxDepth (BFS = Breadth-First Search)
    const queue: Array<{ id: string, depth: number }> = [{ id: focusId, depth: 0 }];
    const visited = new Set<string>([focusId]);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.depth >= maxDepth) continue;

      // Trouver les voisins (sortants et entrants)
      allEdges.forEach(edge => {
        let neighborId: string | null = null;
        let shouldIncludeEdge = false;

        if (edge.from === current.id && !visited.has(edge.to)) {
          neighborId = edge.to;
          shouldIncludeEdge = true;
        } else if (edge.to === current.id && !visited.has(edge.from)) {
          neighborId = edge.from;
          shouldIncludeEdge = true;
        }

        if (neighborId && !visited.has(neighborId)) {
          visited.add(neighborId);
          includedNodeIds.add(neighborId);
          queue.push({ id: neighborId, depth: current.depth + 1 });
        }

        if (shouldIncludeEdge && includedNodeIds.has(edge.from) && includedNodeIds.has(edge.to)) {
          if (!includedEdges.some(e => e.from === edge.from && e.to === edge.to)) {
            includedEdges.push(edge);
          }
        }
      });
    }

    const filteredNodes = allNodes.filter(node => includedNodeIds.has(node.id));

    return { nodes: filteredNodes, edges: includedEdges };
  }

  /**
   * Construit le code Mermaid complet
   */
  private buildMermaidDiagram(nodes: DiagramNode[], edges: DiagramEdge[], config: DiagramConfig): string {
    let mermaidCode = 'flowchart TB\n';

    // Définir les styles
    mermaidCode += '  classDef usStyle fill:#E3F2FD,stroke:#1976D2,stroke-width:2px,color:#000\n';
    mermaidCode += '  classDef faitStyle fill:#FFF3E0,stroke:#F57C00,stroke-width:2px,color:#000\n';
    mermaidCode += '  classDef focusStyle fill:#C8E6C9,stroke:#388E3C,stroke-width:3px,color:#000\n';
    mermaidCode += '  classDef cycleStyle fill:#FFCDD2,stroke:#D32F2F,stroke-width:3px,color:#000\n';

    // Ajouter les nœuds
    nodes.forEach(node => {
      const sanitizedLabel = this.sanitizeLabel(node.label);
      mermaidCode += `  ${node.id}["${sanitizedLabel}"]\n`;
    });

    // Ajouter les arêtes
    edges.forEach(edge => {
      if (edge.type === 'contemporain') {
        mermaidCode += `  ${edge.from} -.->|contemporain| ${edge.to}\n`;
      } else {
        mermaidCode += `  ${edge.from} --> ${edge.to}\n`;
      }
    });

    // Appliquer les styles
    nodes.forEach(node => {
      if (config.focusNode && node.uuid === config.focusNode) {
        mermaidCode += `  class ${node.id} focusStyle\n`;
      } else if (node.type === 'us') {
        mermaidCode += `  class ${node.id} usStyle\n`;
      } else if (node.type === 'fait') {
        mermaidCode += `  class ${node.id} faitStyle\n`;
      }
    });

    return mermaidCode;
  }

  /**
   * Sanitize les IDs pour Mermaid
   */
  private sanitizeId(uuid: string): string {
    return 'node_' + uuid.replace(/-/g, '_');
  }

  /**
   * Sanitize les labels pour éviter les problèmes avec Mermaid
   */
  private sanitizeLabel(label: string): string {
    return label
      .replace(/"/g, '\\"')
      .replace(/\[/g, '(')
      .replace(/]/g, ')')
      .replace(/\n/g, ' ');
  }

  /**
   * Rend le diagramme Mermaid dans un élément DOM
   */
  public async renderDiagram(containerId: string, mermaidCode: string): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id ${containerId} not found`);
    }

    try {
      const { svg } = await mermaid.render(`mermaid-${Date.now()}`, mermaidCode);
      container.innerHTML = svg;
    } catch (error) {
      console.error('Error rendering Mermaid diagram:', error);
      throw error;
    }
  }

  /**
   * Exporte le diagramme en PNG
   */
  public async exportToPNG(containerId: string): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id ${containerId} not found`);
    }

    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2
    });

    const link = document.createElement('a');
    link.download = `stratigraphic-diagram-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /**
   * Exporte le diagramme en PDF
   */
  public async exportToPDF(containerId: string): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id ${containerId} not found`);
    }

    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).jsPDF;

    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`stratigraphic-diagram-${Date.now()}.pdf`);
  }
}
