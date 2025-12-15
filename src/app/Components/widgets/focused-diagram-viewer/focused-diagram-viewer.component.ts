import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import {StratigraphicDiagramService} from '../../../services/stratigraphic-diagram.service';
import {WorkerService} from '../../../services/worker.service';
import panzoom from 'panzoom';

@Component({
  selector: 'app-focused-diagram-viewer',
  templateUrl: './focused-diagram-viewer.component.html',
  styleUrls: ['./focused-diagram-viewer.component.scss']
})
export class FocusedDiagramViewerComponent implements OnChanges, OnDestroy {
  @ViewChild('focusedDiagramContainer', { static: false }) diagramContainer!: ElementRef;

  @Input() entityUuid: string | null = null;
  @Input() entityType: 'us' | 'fait' | null = null;
  @Input() depth: number = 2;
  @Input() layoutMode: 'default' | 'elk' | 'dagre-d3' = 'elk';
  @Input() isVisible: boolean = false;

  isLoading = false;
  errorMessage = '';
  private panzoomInstance: any;
  private hasGenerated = false;

  constructor(
    private diagramService: StratigraphicDiagramService,
    private w: WorkerService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Générer seulement quand le panel devient visible ET qu'on a un entityUuid
    if (changes['isVisible'] && this.isVisible && this.entityUuid && !this.hasGenerated) {
      setTimeout(() => {
        this.generateDiagram();
      }, 300);
    }

    // Regénérer si la profondeur OU le layout change
    if ((changes['depth'] || changes['layoutMode']) && !changes['depth']?.firstChange && this.hasGenerated) {
      setTimeout(() => {
        this.generateDiagram();
      }, 100);
    }
  }

  async generateDiagram(): Promise<void> {
    console.log('=== START generateDiagram ===');
    console.log('entityUuid:', this.entityUuid);
    console.log('entityType:', this.entityType);
    console.log('depth:', this.depth);
    console.log('layoutMode:', this.layoutMode);

    if (!this.entityUuid) {
      console.error('entityUuid is null!');
      this.errorMessage = 'Aucune entité sélectionnée';
      return;
    }

    if (!this.diagramContainer || !this.diagramContainer.nativeElement) {
      console.error('diagramContainer not ready!');
      this.errorMessage = 'Conteneur non disponible, veuillez réessayer';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.disposePanZoom();

    try {
      const relations = this.w.data().objects.stratigraphie.all.list
        .map(item => item.item)
        .filter(rel => rel && rel.live !== false);

      console.log('Relations trouvées:', relations.length);

      if (relations.length === 0) {
        this.errorMessage = 'Aucune relation stratigraphique disponible';
        this.isLoading = false;
        return;
      }

      // IMPORTANT: Définir le mode de layout AVANT de générer le code
      console.log('Setting layout mode:', this.layoutMode);
      this.diagramService.setLayoutMode(this.layoutMode);

      const config = {
        includeUS: true,
        includeFaits: true,
        includeContemporaryRelations: true,
        includeContainmentRelations: true,
        groupContemporaries: true,
        maxDepth: this.depth,
        focusNode: this.entityUuid
      };

      console.log('Config:', config);

      const result = this.diagramService.generateMermaidCodeWithNodes(relations, config);

      console.log('Mermaid code généré, longueur:', result.code.length);
      console.log('Nodes trouvés:', result.nodes.length);

      const containerId = this.diagramContainer.nativeElement.id || 'focused-diagram-' + Date.now();
      this.diagramContainer.nativeElement.id = containerId;

      console.log('Rendering dans:', containerId);

      await this.diagramService.renderDiagram(containerId, result.code);

      console.log('Render OK, initialisation pan/zoom...');

      this.hasGenerated = true;

      setTimeout(() => {
        this.initializePanZoom();
        this.centerDiagram();
        console.log('=== END generateDiagram SUCCESS ===');
      }, 100);

    } catch (error) {
      console.error('=== ERREUR generateDiagram ===', error);
      this.errorMessage = 'Impossible de générer le diagramme: ' + (error as Error).message;
    } finally {
      this.isLoading = false;
    }
  }

  private initializePanZoom(): void {
    const svg = this.diagramContainer?.nativeElement.querySelector('svg');
    if (!svg) {
      console.warn('SVG not found for panzoom');
      return;
    }

    this.panzoomInstance = panzoom(svg, {
      maxZoom: 3,
      minZoom: 0.3,
      bounds: true,
      boundsPadding: 0.1
    });
  }

  private disposePanZoom(): void {
    if (this.panzoomInstance) {
      this.panzoomInstance.dispose();
      this.panzoomInstance = null;
    }
  }

  private centerDiagram(): void {
    if (!this.panzoomInstance) return;

    const container = this.diagramContainer.nativeElement;
    const svg = container.querySelector('svg');
    if (!svg) return;

    const containerRect = container.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    const scale = Math.min(
      containerRect.width / svgRect.width,
      containerRect.height / svgRect.height,
      1
    ) * 0.9;

    this.panzoomInstance.moveTo(0, 0);
    this.panzoomInstance.zoomAbs(0, 0, scale);

    const offsetX = (containerRect.width - svgRect.width * scale) / 2;
    const offsetY = (containerRect.height - svgRect.height * scale) / 2;
    this.panzoomInstance.moveTo(offsetX, offsetY);
  }

  zoomIn(): void {
    if (this.panzoomInstance) {
      const container = this.diagramContainer.nativeElement;
      const rect = container.getBoundingClientRect();
      this.panzoomInstance.smoothZoom(rect.width / 2, rect.height / 2, 1.2);
    }
  }

  zoomOut(): void {
    if (this.panzoomInstance) {
      const container = this.diagramContainer.nativeElement;
      const rect = container.getBoundingClientRect();
      this.panzoomInstance.smoothZoom(rect.width / 2, rect.height / 2, 0.8);
    }
  }

  resetView(): void {
    this.centerDiagram();
  }

  ngOnDestroy(): void {
    this.disposePanZoom();
  }
}
