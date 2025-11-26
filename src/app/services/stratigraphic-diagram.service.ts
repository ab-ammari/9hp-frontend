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

export interface ContemporaryGroup {
  id: string;
  nodes: DiagramNode[];
  level: number;
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

  private currentLayoutMode: 'default' | 'elk' | 'dagre-d3' = 'default';

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
        padding: 40
      },
      securityLevel: 'loose'
    });
  }

  /**
   * Génère le code Mermaid pour un diagramme stratigraphique
   */
  public generateMermaidCode(
    relations: ApiStratigraphie[],
    config: DiagramConfig = {
      includeUS: true,
      includeFaits: true,
      includeContemporaryRelations: true,
      groupContemporaries: false
    }
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
   * Identifie les groupes d'entités contemporaines
   */
  private identifyContemporaryGroups(
    nodes: DiagramNode[],
    edges: DiagramEdge[]
  ): ContemporaryGroup[] {
    const contemporaryEdges = edges.filter(edge => edge.type === 'contemporain');
    const groups: ContemporaryGroup[] = [];
    const visited = new Set<string>();

    nodes.forEach(node => {
      if (visited.has(node.id)) return;

      // Recherche en largeur pour trouver tous les nœuds contemporains connectés
      const group: DiagramNode[] = [node];
      const queue = [node.id];
      visited.add(node.id);

      while (queue.length > 0) {
        const currentId = queue.shift()!;

        // Trouver tous les nœuds contemporains connectés
        contemporaryEdges.forEach(edge => {
          let neighborId: string | null = null;

          if (edge.from === currentId && !visited.has(edge.to)) {
            neighborId = edge.to;
          } else if (edge.to === currentId && !visited.has(edge.from)) {
            neighborId = edge.from;
          }

          if (neighborId && !visited.has(neighborId)) {
            const neighborNode = nodes.find(n => n.id === neighborId);
            if (neighborNode) {
              group.push(neighborNode);
              queue.push(neighborId);
              visited.add(neighborId);
            }
          }
        });
      }

      if (group.length > 0) {
        groups.push({
          id: `group_${groups.length}`,
          nodes: group,
          level: this.calculateGroupLevel(group, edges)
        });
      }
    });

    return groups;
  }

  /**
   * Calcule le niveau d'un groupe dans la hiérarchie
   */
  private calculateGroupLevel(groupNodes: DiagramNode[], allEdges: DiagramEdge[]): number {
    let maxLevel = 0;

    groupNodes.forEach(node => {
      // Compter le nombre de nœuds antérieurs (profondeur depuis les feuilles)
      const level = this.calculateNodeDepth(node.id, allEdges, new Set());
      if (maxLevel===0)
        maxLevel = Math.max(maxLevel, level);
      else maxLevel = Math.min(maxLevel, level);
    });

    return maxLevel;
  }

  /**
   * Calcule la profondeur d'un nœud
   */
  private calculateNodeDepth(nodeId: string, edges: DiagramEdge[], visited: Set<string>): number {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);

    const anteriorEdges = edges.filter(edge =>
      edge.to === nodeId && edge.type !== 'contemporain'
    );

    if (anteriorEdges.length === 0) return 0;

    let maxDepth = 0;
    anteriorEdges.forEach(edge => {
      const depth = 1 + this.calculateNodeDepth(edge.from, edges, visited);
      maxDepth = Math.max(maxDepth, depth);
    });

    return maxDepth;
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

    // Étape 1: BFS pour trouver les nœuds à distance <= maxDepth (relations non-contemporaines)
    const queue: Array<{ id: string, depth: number }> = [{ id: focusId, depth: 0 }];
    const visited = new Set<string>([focusId]);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.depth >= maxDepth) continue;

      // Trouver les voisins via relations hiérarchiques (non-contemporaines)
      allEdges.forEach(edge => {
        // Ignorer les relations contemporaines dans la première passe
        if (edge.type === 'contemporain') return;

        let neighborId: string | null = null;

        if (edge.from === current.id && !visited.has(edge.to)) {
          neighborId = edge.to;
        } else if (edge.to === current.id && !visited.has(edge.from)) {
          neighborId = edge.from;
        }

        if (neighborId && !visited.has(neighborId)) {
          visited.add(neighborId);
          includedNodeIds.add(neighborId);
          queue.push({ id: neighborId, depth: current.depth + 1 });
        }
      });
    }

    // Étape 2: Étendre pour inclure TOUS les nœuds contemporains de façon transitive
    this.expandContemporaryNodes(includedNodeIds, allNodes, allEdges);

    // Étape 3: Filtrer les nœuds et les arêtes
    const filteredNodes = allNodes.filter(node => includedNodeIds.has(node.id));

    // Inclure toutes les arêtes entre les nœuds inclus
    const includedEdges = allEdges.filter(edge =>
      includedNodeIds.has(edge.from) && includedNodeIds.has(edge.to)
    );

    return { nodes: filteredNodes, edges: includedEdges };
  }

  /**
   * Étend l'ensemble des nœuds inclus pour ajouter tous les nœuds contemporains de façon transitive
   * Si un nœud A est inclus et A est contemporain de B, alors B doit être inclus
   * Si B est contemporain de C, alors C doit aussi être inclus, etc.
   */
  private expandContemporaryNodes(
    includedNodeIds: Set<string>,
    allNodes: DiagramNode[],
    allEdges: DiagramEdge[]
  ): void {
    // Filtrer uniquement les relations contemporaines
    const contemporaryEdges = allEdges.filter(edge => edge.type === 'contemporain');

    if (contemporaryEdges.length === 0) return;

    // Construire un graphe d'adjacence pour les relations contemporaines
    const contemporaryGraph = new Map<string, Set<string>>();

    contemporaryEdges.forEach(edge => {
      if (!contemporaryGraph.has(edge.from)) {
        contemporaryGraph.set(edge.from, new Set());
      }
      if (!contemporaryGraph.has(edge.to)) {
        contemporaryGraph.set(edge.to, new Set());
      }
      contemporaryGraph.get(edge.from)!.add(edge.to);
      contemporaryGraph.get(edge.to)!.add(edge.from);
    });

    // Pour chaque nœud déjà inclus, faire un BFS pour trouver tous les contemporains transitifs
    const nodesToExpand = Array.from(includedNodeIds);
    const expandedNodes = new Set<string>(includedNodeIds);

    nodesToExpand.forEach(nodeId => {
      if (!contemporaryGraph.has(nodeId)) return;

      // BFS pour trouver tous les contemporains transitifs
      const queue = [nodeId];
      const visitedInExpansion = new Set<string>([nodeId]);

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const neighbors = contemporaryGraph.get(currentId);

        if (!neighbors) continue;

        neighbors.forEach(neighborId => {
          if (!visitedInExpansion.has(neighborId)) {
            visitedInExpansion.add(neighborId);
            expandedNodes.add(neighborId);
            queue.push(neighborId);
          }
        });
      }
    });

    // Ajouter tous les nœuds contemporains trouvés à l'ensemble des nœuds inclus
    expandedNodes.forEach(nodeId => {
      // Vérifier que ce nœud existe dans allNodes
      const nodeExists = allNodes.some(n => n.id === nodeId);
      if (nodeExists) {
        includedNodeIds.add(nodeId);
      }
    });
  }

  /**
   * Construit le code Mermaid complet avec support des groupes contemporains
   */
  private buildMermaidDiagram(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    config: DiagramConfig
  ): string {
    let mermaidCode = 'flowchart TB\n';

    // Définir les styles
    mermaidCode += '  classDef usStyle fill:#E3F2FD,stroke:#1976D2,stroke-width:2px,color:#000\n';
    mermaidCode += '  classDef faitStyle fill:#FFF3E0,stroke:#F57C00,stroke-width:2px,color:#000\n';
    mermaidCode += '  classDef focusStyle fill:#C8E6C9,stroke:#388E3C,stroke-width:3px,color:#000\n';
    mermaidCode += '  classDef cycleStyle fill:#FFCDD2,stroke:#D32F2F,stroke-width:3px,color:#000\n';
    mermaidCode += '  classDef groupStyle fill:#F5F5F5,stroke:#9E9E9E,stroke-width:1px,stroke-dasharray: 5 5\n';

    if (config.groupContemporaries) {
      const groups = this.identifyContemporaryGroups(nodes, edges);
      const groupedNodes = new Set<string>();

      // Trier les groupes par niveau (du plus profond au plus superficiel)
      groups.sort((a, b) => b.level - a.level);

      groups.forEach(group => {
        if (group.nodes.length > 1) {
          // Créer un sous-graphe horizontal pour les groupes contemporains
          mermaidCode += `  subgraph ${group.id} [" "]\n`;
          mermaidCode += `    direction LR\n`;

          group.nodes.forEach(node => {
            const sanitizedLabel = this.sanitizeLabel(node.label);
            mermaidCode += `    ${node.id}["${sanitizedLabel}"]\n`;
            groupedNodes.add(node.id);
          });

          mermaidCode += `  end\n`;
          mermaidCode += `  class ${group.id} groupStyle\n`;
        }
      });

      // Ajouter les nœuds non groupés
      nodes.forEach(node => {
        if (!groupedNodes.has(node.id)) {
          const sanitizedLabel = this.sanitizeLabel(node.label);
          mermaidCode += `  ${node.id}["${sanitizedLabel}"]\n`;
        }
      });
    } else {
      // Ajouter les nœuds normalement
      nodes.forEach(node => {
        const sanitizedLabel = this.sanitizeLabel(node.label);
        mermaidCode += `  ${node.id}["${sanitizedLabel}"]\n`;
      });
    }

    // Ajouter les arêtes (exclure les relations contemporaines entre nœuds du même groupe)
    if (config.groupContemporaries) {
      const groups = this.identifyContemporaryGroups(nodes, edges);
      const sameGroupPairs = new Set<string>();

      // Identifier les paires dans le même groupe
      groups.forEach(group => {
        if (group.nodes.length > 1) {
          for (let i = 0; i < group.nodes.length; i++) {
            for (let j = i + 1; j < group.nodes.length; j++) {
              sameGroupPairs.add(`${group.nodes[i].id}-${group.nodes[j].id}`);
              sameGroupPairs.add(`${group.nodes[j].id}-${group.nodes[i].id}`);
            }
          }
        }
      });

      edges.forEach(edge => {
        const pairKey = `${edge.from}-${edge.to}`;

        if (edge.type === 'contemporain' && sameGroupPairs.has(pairKey)) {
          // Skip les relations contemporaines dans le même groupe
          return;
        }

        if (edge.type === 'contemporain') {
          mermaidCode += `  ${edge.from} -.->|contemporain| ${edge.to}\n`;
        } else {
          mermaidCode += `  ${edge.from} --> ${edge.to}\n`;
        }
      });
    } else {
      edges.forEach(edge => {
        if (edge.type === 'contemporain') {
          mermaidCode += `  ${edge.from} -.->|contemporain| ${edge.to}\n`;
        } else {
          mermaidCode += `  ${edge.from} --> ${edge.to}\n`;
        }
      });
    }

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

  /**
   * Définit le mode de layout Mermaid
   */
  public setLayoutMode(mode: 'default' | 'elk' | 'dagre-d3'): void {
    this.currentLayoutMode = mode;
    this.reinitializeMermaid();
  }

  /**
   * Réinitialise Mermaid avec la nouvelle configuration
   */
  private reinitializeMermaid(): void {
    const config: any = {
      startOnLoad: false,
      theme: 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        rankSpacing: 30,
        nodeSpacing: 30,
        padding: 40
      },
      securityLevel: 'loose'
    };

    // Configuration spécifique selon le mode
    switch (this.currentLayoutMode) {
      case 'elk':
        config.flowchart.defaultRenderer = 'elk';
        break;
      case 'dagre-d3':
        config.flowchart.defaultRenderer = 'dagre-d3';
        break;
      default:
        // Utiliser le renderer par défaut
        break;
    }

    mermaid.initialize(config);
  }

  /**
   * Génère le code Mermaid et retourne également les nœuds pour la recherche
   */
  public generateMermaidCodeWithNodes(
    relations: ApiStratigraphie[],
    config: DiagramConfig = {
      includeUS: true,
      includeFaits: true,
      includeContemporaryRelations: true,
      groupContemporaries: false
    }
  ): { code: string; nodes: DiagramNode[] } {
    const nodes = this.extractNodes(relations, config);
    const edges = this.extractEdges(relations, config);

    let filteredNodes = nodes;
    let filteredEdges = edges;

    if (config.focusNode && config.maxDepth !== undefined) {
      const subgraph = this.extractSubgraph(config.focusNode, nodes, edges, config.maxDepth);
      filteredNodes = subgraph.nodes;
      filteredEdges = subgraph.edges;
    }

    const code = this.buildMermaidDiagram(filteredNodes, filteredEdges, config);

    return { code, nodes: filteredNodes };
  }

  /**
   * Configure les interactions de survol sur les arêtes du diagramme
   */
  public setupEdgeHoverInteractions(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const svg = container.querySelector('svg');
    if (!svg) return;

    const edgePaths = svg.querySelectorAll('.edgePath');

    edgePaths.forEach((edgePath) => {
      const path = edgePath.querySelector('path');
      if (!path) return;

      const edgeId = edgePath.id || '';
      const nodeIds = this.extractNodeIdsFromEdge(edgeId, svg);

      if (!nodeIds) return;

      // Trouver les labels des nœuds
      const sourceNode = svg.querySelector(`[id*="${nodeIds.sourceId}"]`);
      const targetNode = svg.querySelector(`[id*="${nodeIds.targetId}"]`);
      const sourceLabel = sourceNode?.querySelector('text')?.textContent || nodeIds.sourceId;
      const targetLabel = targetNode?.querySelector('text')?.textContent || nodeIds.targetId;

      // Déterminer le type de relation
      const isContemporary = edgePath.querySelector('path[stroke-dasharray]') !== null;
      const relationType = isContemporary ? 'Contemporain' : 'Antérieur → Postérieur';

      path.addEventListener('mouseenter', (e: Event) => {
        this.highlightEdgeRelation(svg, nodeIds.sourceId, nodeIds.targetId, true);
        this.showEdgeTooltip(e as MouseEvent, sourceLabel, targetLabel, relationType);
      });

      path.addEventListener('mouseleave', () => {
        this.highlightEdgeRelation(svg, nodeIds.sourceId, nodeIds.targetId, false);
        this.hideEdgeTooltip();
      });

      // Utiliser setAttribute pour les éléments SVG
      path.style.cursor = 'pointer';
    });
  }

  /**
   * Extrait les IDs source et destination d'une arête
   */
  private extractNodeIdsFromEdge(edgeId: string, svg: SVGElement): { sourceId: string, targetId: string } | null {
    // Format typique de Mermaid: "L-node_xxx-node_yyy" ou similaire
    const idMatch = edgeId.match(/L?-?(node_[a-f0-9_]+)-(node_[a-f0-9_]+)/i);
    if (idMatch) {
      return {
        sourceId: idMatch[1],
        targetId: idMatch[2]
      };
    }

    // Méthode 2: Chercher dans les attributs
    const edgePath = svg.querySelector(`#${CSS.escape(edgeId)}`);
    if (edgePath) {
      const sourceId = edgePath.getAttribute('data-source') || '';
      const targetId = edgePath.getAttribute('data-target') || '';
      if (sourceId && targetId) {
        return { sourceId, targetId };
      }
    }

    return null;
  }

  /**
   * Met en évidence ou retire la mise en évidence d'une relation
   */
  private highlightEdgeRelation(
    svg: SVGElement,
    sourceId: string,
    targetId: string,
    highlight: boolean
  ): void {
    const sourceNode = svg.querySelector(`[id*="${sourceId}"]`) ||
      svg.querySelector(`g.node[id*="${sourceId}"]`);
    const targetNode = svg.querySelector(`[id*="${targetId}"]`) ||
      svg.querySelector(`g.node[id*="${targetId}"]`);

    const edge = svg.querySelector(`.edgePath[id*="${sourceId}"][id*="${targetId}"]`) ||
      svg.querySelector(`[id*="L-${sourceId}-${targetId}"]`);

    if (highlight) {
      sourceNode?.classList.add('edge-hover-source');
      targetNode?.classList.add('edge-hover-target');
      edge?.classList.add('edge-hover-active');

      this.applyHighlightStyles(sourceNode, 'source');
      this.applyHighlightStyles(targetNode, 'target');
      this.applyEdgeHighlightStyles(edge);
      this.dimOtherElements(svg, [sourceId, targetId]);
    } else {
      sourceNode?.classList.remove('edge-hover-source');
      targetNode?.classList.remove('edge-hover-target');
      edge?.classList.remove('edge-hover-active');

      this.removeHighlightStyles(sourceNode);
      this.removeHighlightStyles(targetNode);
      this.removeEdgeHighlightStyles(edge);
      this.restoreAllElements(svg);
    }
  }

  /**
   * Applique les styles de surbrillance à un nœud
   */
  private applyHighlightStyles(element: Element | null, type: 'source' | 'target'): void {
    if (!element) return;

    const shape = element.querySelector('rect, polygon, circle, ellipse') as SVGElement | null;
    const text = element.querySelector('text') as SVGTextElement | null;

    if (shape) {
      shape.style.transition = 'all 0.3s ease';

      if (type === 'source') {
        shape.style.filter = 'drop-shadow(0 0 8px #4CAF50) drop-shadow(0 0 16px #4CAF50)';
        shape.setAttribute('stroke', '#2E7D32');
        shape.setAttribute('stroke-width', '3');
      } else {
        shape.style.filter = 'drop-shadow(0 0 8px #2196F3) drop-shadow(0 0 16px #2196F3)';
        shape.setAttribute('stroke', '#1565C0');
        shape.setAttribute('stroke-width', '3');
      }
    }

    if (text) {
      text.style.fontWeight = 'bold';
      text.style.transition = 'all 0.3s ease';
    }
  }

  /**
   * Applique les styles de surbrillance à une arête
   */
  private applyEdgeHighlightStyles(element: Element | null): void {
    if (!element) return;

    const path = element.querySelector('path') as SVGPathElement | null;
    if (path) {
      path.style.transition = 'all 0.3s ease';
      path.setAttribute('stroke', '#FF5722');
      path.setAttribute('stroke-width', '4');
      path.style.filter = 'drop-shadow(0 0 4px #FF5722)';
    }

    const marker = element.querySelector('marker path') as SVGPathElement | null;
    if (marker) {
      marker.setAttribute('fill', '#FF5722');
    }
  }

  /**
   * Retire les styles de surbrillance d'un nœud
   */
  private removeHighlightStyles(element: Element | null): void {
    if (!element) return;

    const shape = element.querySelector('rect, polygon, circle, ellipse') as SVGElement | null;
    const text = element.querySelector('text') as SVGTextElement | null;

    if (shape) {
      shape.style.filter = '';
      shape.removeAttribute('stroke');
      shape.removeAttribute('stroke-width');
    }

    if (text) {
      text.style.fontWeight = '';
    }
  }

  /**
   * Retire les styles de surbrillance d'une arête
   */
  private removeEdgeHighlightStyles(element: Element | null): void {
    if (!element) return;

    const path = element.querySelector('path') as SVGPathElement | null;
    if (path) {
      path.removeAttribute('stroke');
      path.removeAttribute('stroke-width');
      path.style.filter = '';
    }

    const marker = element.querySelector('marker path') as SVGPathElement | null;
    if (marker) {
      marker.removeAttribute('fill');
    }
  }

  /**
   * Réduit l'opacité des éléments non concernés
   */
  private dimOtherElements(svg: SVGElement, activeNodeIds: string[]): void {
    const allNodes = svg.querySelectorAll('g.node');
    const allEdges = svg.querySelectorAll('.edgePath');

    allNodes.forEach(node => {
      const nodeId = node.id || '';
      const isActive = activeNodeIds.some(id => nodeId.includes(id));

      if (!isActive) {
        (node as SVGElement).style.opacity = '0.3';
        (node as SVGElement).style.transition = 'opacity 0.3s ease';
      }
    });

    allEdges.forEach(edge => {
      const edgeId = edge.id || '';
      const isActive = activeNodeIds.every(id => edgeId.includes(id));

      if (!isActive) {
        (edge as SVGElement).style.opacity = '0.2';
        (edge as SVGElement).style.transition = 'opacity 0.3s ease';
      }
    });
  }

  /**
   * Restaure l'opacité de tous les éléments
   */
  private restoreAllElements(svg: SVGElement): void {
    const allNodes = svg.querySelectorAll('g.node');
    const allEdges = svg.querySelectorAll('.edgePath');

    allNodes.forEach(node => {
      (node as SVGElement).style.opacity = '';
    });

    allEdges.forEach(edge => {
      (edge as SVGElement).style.opacity = '';
    });
  }

  /**
   * Cache le tooltip
   */
  private hideEdgeTooltip(): void {
    const tooltip = document.getElementById('edge-hover-tooltip');
    if (tooltip) {
      const handler = (tooltip as any)._moveHandler;
      if (handler) {
        document.removeEventListener('mousemove', handler);
      }
      tooltip.remove();
    }
  }

  /**
   * Crée et affiche un tooltip pour une arête
   */
  private showEdgeTooltip(
    event: MouseEvent,
    sourceLabel: string,
    targetLabel: string,
    relationType: string
  ): void {
    // Supprimer l'ancien tooltip s'il existe
    this.hideEdgeTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'edge-tooltip';
    tooltip.id = 'edge-hover-tooltip';

    tooltip.innerHTML = `
    <div class="tooltip-header">
      <span class="tooltip-source">${sourceLabel}</span>
      <span class="tooltip-arrow">→</span>
      <span class="tooltip-target">${targetLabel}</span>
    </div>
    <div class="tooltip-relation-type">${relationType}</div>
  `;

    document.body.appendChild(tooltip);

    // Positionner le tooltip près du curseur
    const updatePosition = (e: MouseEvent) => {
      const x = e.clientX + 15;
      const y = e.clientY + 15;

      // S'assurer que le tooltip reste dans la fenêtre
      const rect = tooltip.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 10;
      const maxY = window.innerHeight - rect.height - 10;

      tooltip.style.left = `${Math.min(x, maxX)}px`;
      tooltip.style.top = `${Math.min(y, maxY)}px`;
    };

    updatePosition(event);

    // Suivre le curseur
    document.addEventListener('mousemove', updatePosition);
    (tooltip as any)._moveHandler = updatePosition;
  }

}
