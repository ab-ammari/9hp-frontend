import { Injectable } from '@angular/core';
import { WorkerService } from './worker.service';
import { ApiStratigraphie, ApiDbTable } from '../../../shared';
import mermaid from 'mermaid';
import { saveAs } from 'file-saver';


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

  private currentLayoutMode: 'default' | 'elk' | 'dagre-d3' = 'elk';

  constructor(
    private w: WorkerService
  ) {
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
        padding: 40,
        defaultRenderer: 'elk'  
      },
      securityLevel: 'loose'
    });
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
      if (rel.us_anterieur && config.includeUS) {
        from = rel.us_anterieur;
      } else if (rel.fait_anterieur && config.includeFaits) {
        from = rel.fait_anterieur;
      }

      if (rel.us_posterieur && config.includeUS) {
        to = rel.us_posterieur;
      } else if (rel.fait_posterieur && config.includeFaits) {
        to = rel.fait_posterieur;
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

    // Ajouter les US enfants des Faits inclus
    const faitToUS = this.buildFaitToUSMap([]);
    const faitsIncluded = Array.from(includedNodeIds)
      .map(id => allNodes.find(n => n.id === id && n.type === 'fait'))
      .filter(n => n !== undefined) as DiagramNode[];

    faitsIncluded.forEach(fait => {
      const usUuids = faitToUS.get(fait.uuid);
      if (usUuids) {
        usUuids.forEach(usUuid => {
          const usNode = allNodes.find(n => n.uuid === usUuid);
          if (usNode) {
            includedNodeIds.add(usNode.id);
          }
        });
      }
    });

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

    const faitToUS = this.buildFaitToUSMap([]);

    const faitNodes = nodes.filter(n => n.type === 'fait');
    const usNodes = nodes.filter(n => n.type === 'us');
    const usInFaits = new Set<string>();

    faitNodes.forEach(fait => {
      const usUuids = faitToUS.get(fait.uuid);

      if (usUuids && usUuids.size > 0) {
        //vérifier qu'au moins une US est présente dans les nœuds filtrés
        const usNodesInFait = usNodes.filter(n => usUuids.has(n.uuid));

        if (usNodesInFait.length > 0) {
          // Créer un subgraph pour ce Fait
          const sanitizedLabel = this.sanitizeLabel(fait.label);
          mermaidCode += `  subgraph ${fait.id}["${sanitizedLabel}"]\n`;
          mermaidCode += `    direction TB\n`;

          // Ajouter tous les US contenus
          usNodesInFait.forEach(usNode => {
            const usLabel = this.sanitizeLabel(usNode.label);
            mermaidCode += `    ${usNode.id}["${usLabel}"]\n`;
            usInFaits.add(usNode.id);
          });

          mermaidCode += `  end\n`;
          mermaidCode += `  class ${fait.id} faitStyle\n`;
        } else {
          // Fait sans US dans le graphe filtré : nœud simple
          const sanitizedLabel = this.sanitizeLabel(fait.label);
          mermaidCode += `  ${fait.id}["${sanitizedLabel}"]\n`;
        }
      } else {
        // Fait sans US : nœud simple
        const sanitizedLabel = this.sanitizeLabel(fait.label);
        mermaidCode += `  ${fait.id}["${sanitizedLabel}"]\n`;
      }
    });

    if (config.groupContemporaries) {
      const groups = this.identifyContemporaryGroups(nodes, edges);
      const groupedNodes = new Set<string>();

      groups.sort((a, b) => b.level - a.level);

      groups.forEach(group => {
        if (group.nodes.length > 1) {
          // 🆕 Filtrer les US déjà dans des Faits
          const nodesToGroup = group.nodes.filter(node => !usInFaits.has(node.id));

          if (nodesToGroup.length > 1) {
            mermaidCode += `  subgraph ${group.id} [" "]\n`;
            mermaidCode += `    direction LR\n`;

            nodesToGroup.forEach(node => {
              const sanitizedLabel = this.sanitizeLabel(node.label);
              mermaidCode += `    ${node.id}["${sanitizedLabel}"]\n`;
              groupedNodes.add(node. id);
            });

            mermaidCode += `  end\n`;
            mermaidCode += `  class ${group.id} groupStyle\n`;
          }
        }
      });

      // Ajouter les nœuds non groupés ET non dans des Faits
      nodes. forEach(node => {
        if (!groupedNodes.has(node.id) && !usInFaits. has(node.id) && node.type !== 'fait') {
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
   * Exporte le diagramme en SVG
   */
  public async exportToSVG(containerId: string): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id ${containerId} not found`);
    }

    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      throw new Error('SVG element not found in container');
    }

    try {
      // Cloner le SVG pour ne pas modifier l'original
      const svgClone = svgElement.cloneNode(true) as SVGElement;

      // Ajouter le namespace XML si absent
      if (!svgClone.hasAttribute('xmlns')) {
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      if (!svgClone.hasAttribute('xmlns:xlink')) {
        svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      }

      // Récupérer tous les styles inline et CSS
      const styleSheets = this.extractStyles(svgElement);

      // Injecter les styles dans le SVG
      if (styleSheets) {
        const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        styleElement. textContent = styleSheets;
        svgClone.insertBefore(styleElement, svgClone.firstChild);
      }

      // Sérialiser le SVG
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgClone);

      // Ajouter la déclaration XML
      svgString = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgString;

      // Créer un Blob et télécharger
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      saveAs(blob, `stratigraphic-diagram-${Date.now()}.svg`);
    } catch (error) {
      console.error('Error in SVG export:', error);
      throw new Error('Impossible d\'exporter en SVG.');
    }
  }

  /**
   * Convertit un SVG en Canvas
   */
  private async svgToCanvas(svgElement: SVGElement): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      try {
        // Cloner le SVG
        const svgClone = svgElement.cloneNode(true) as SVGElement;

        // S'assurer que le SVG a les bons attributs
        const bbox = svgElement.getBoundingClientRect();
        const width = bbox.width || parseInt(svgElement.getAttribute('width') || '800');
        const height = bbox. height || parseInt(svgElement. getAttribute('height') || '600');

        svgClone.setAttribute('width', width.toString());
        svgClone.setAttribute('height', height. toString());
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // Extraire et injecter les styles
        const styles = this.extractStyles(svgElement);
        if (styles) {
          const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
          styleElement.textContent = styles;
          svgClone.insertBefore(styleElement, svgClone.firstChild);
        }

        // Sérialiser le SVG
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgClone);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        // Créer une image
        const img = new Image();
        img.width = width;
        img.height = height;

        img.onload = () => {
          // Créer un canvas
          const canvas = document.createElement('canvas');
          canvas.width = width * 2; // 2x pour meilleure qualité
          canvas.height = height * 2;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Cannot get canvas context'));
            return;
          }

          // Fond blanc
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Dessiner l'image
          ctx.scale(2, 2);
          ctx.drawImage(img, 0, 0, width, height);

          URL.revokeObjectURL(url);
          resolve(canvas);
        };

        img.onerror = (error) => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load SVG image: ' + error));
        };

        img.src = url;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Extrait tous les styles CSS appliqués au SVG
   */
  private extractStyles(svgElement: SVGElement): string {
    const styleSheets: string[] = [];

    // Récupérer les styles inline
    const allElements = svgElement.querySelectorAll('*');
    allElements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element);
      const styleString = computedStyle.cssText;
      if (styleString) {
        element.setAttribute('style', styleString);
      }
    });

    // Récupérer les classes CSS du document
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const sheet = document.styleSheets[i];
        if (sheet.cssRules) {
          for (let j = 0; j < sheet.cssRules.length; j++) {
            const rule = sheet.cssRules[j];
            if (rule instanceof CSSStyleRule) {
              // Vérifier si la règle s'applique au SVG
              if (svgElement.querySelector(rule.selectorText)) {
                styleSheets.push(rule.cssText);
              }
            }
          }
        }
      } catch (e) {
        // Ignorer les erreurs CORS
        console.warn('Cannot access stylesheet:', e);
      }
    }

    return styleSheets.join('\n');
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
   * Construit une map Fait UUID -> liste des US UUIDs contenus
   */
  private buildFaitToUSMap(relations: ApiStratigraphie[]): Map<string, Set<string>> {
    const faitToUS = new Map<string, Set<string>>();

    // Parcourir toutes les US pour trouver leur Fait parent
    this.w.data().objects.us.all.list.forEach(usWrapper => {
      const us = usWrapper.item;
      if (us && us.live !== false && us.fait_uuid) {
        if (!faitToUS.has(us.fait_uuid)) {
          faitToUS.set(us.fait_uuid, new Set<string>());
        }
        faitToUS.get(us.fait_uuid)!.add(us.us_uuid);
      }
    });

    return faitToUS;
  }
}
