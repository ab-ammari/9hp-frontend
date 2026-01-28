import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed
} from '@angular/core';
import { MapService } from '../../services/map.service';
import { GmlParserService } from '../../services/gml-parser.service';
import { ProjectionService } from '../../services/projection.service';
import { LayerService } from '../../services/layer.service';
import { StyleService } from '../../services/style.service';
import { GeoFeature, MapLayer } from '../../models/geo-feature.model';
import { Coordinate3D } from '../../models/geo-feature.model';


@Component({
  selector: 'app-map-container',
  templateUrl: './map-container.component.html',
  styleUrls: ['./map-container.component.scss']
})
export class MapContainerComponent implements OnInit, OnDestroy {

  @ViewChild('mapElement', { static: true }) mapElement!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // État du composant
  isLayerPanelOpen = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Données
  features = signal<GeoFeature[]>([]);

  // Compteur de features (délégué au LayerService)
  totalFeatureCount = computed(() => this.layerService.totalFeatureCount());

  constructor(
    public mapService: MapService,
    public layerService: LayerService,
    public styleService: StyleService,
    private gmlParser: GmlParserService,
    public projectionService: ProjectionService
  ) { }

  ngOnInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.mapService.destroy();
  }

  /**
   * Initialise la carte
   */
  private initMap(): void {
    this.mapService.initializeMap(this.mapElement.nativeElement, {
      crs: 'EPSG:3946',  
      center: [1700000, 5200000],  
      zoom: 5
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Gestion du fichier GML
  // ═══════════════════════════════════════════════════════════════

  openFileSelector(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.loadGmlFile(input.files[0]);
    }
    input.value = '';
  }

  async loadGmlFile(file: File): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const content = await file.text();
      const parsedFeatures = this.gmlParser.parseGML(content);

      if (parsedFeatures.length === 0) {
        this.errorMessage.set('Aucune entité trouvée dans le fichier GML');
        return;
      }

      // Détecter le CRS source
      const firstCoord = this.getFirstCoordinate(parsedFeatures);
      if (firstCoord) {
        const sourceCRS = this.projectionService.detectCRS(firstCoord.x, firstCoord.y);
        const targetCRS = this.projectionService.getCurrentCRS();
        
        console.log(`[MapContainer] CRS détecté: ${sourceCRS}, CRS carte: ${targetCRS}`);

        if (sourceCRS !== targetCRS) {
          this.reprojectFeatures(parsedFeatures, sourceCRS, targetCRS);
        }
      }

      this.features.set(parsedFeatures);
      this.layerService.clearAllLayers();
      this.createLayersFromFeatures(parsedFeatures, file.name);

      setTimeout(() => this.layerService.zoomToAllLayers(), 100);

    } catch (error) {
      console.error('[MapContainer] Erreur:', error);
      this.errorMessage.set('Erreur lors du chargement du fichier GML');
    } finally {
      this.isLoading.set(false);
    }
  }

  private reprojectFeatures(features: GeoFeature[], from: string, to: string): void {
    features.forEach(f => {
      if (Array.isArray(f.coordinates[0]) && Array.isArray((f.coordinates[0] as any)[0])) {
        f.coordinates = (f.coordinates as Coordinate3D[][]).map(ring =>
          ring.map(c => this.reprojectCoord(c, from, to))
        );
      } else {
        f.coordinates = (f.coordinates as Coordinate3D[]).map(c => 
          this.reprojectCoord(c, from, to)
        );
      }
    });
  }

  private reprojectCoord(c: Coordinate3D, from: string, to: string): Coordinate3D {
    const [x, y] = this.projectionService.transform([c.x, c.y], from, to);
    return { x, y, z: c.z };
  }

  /**
   * Crée les couches à partir des features groupées par type
   */
  private createLayersFromFeatures(features: GeoFeature[], fileName?: string): void {
    const grouped = this.gmlParser.groupByType(features);
    const layerIds: string[] = [];

    let zIndex = 10;
    Object.entries(grouped).forEach(([type, typeFeatures]) => {
      const layerId = `layer_${type.replace(/\s+/g, '_').toLowerCase()}`;
      
      this.layerService.addArcheoLayer(
        typeFeatures,
        layerId,
        type,
        { visible: true, opacity: 0.8, zIndex: zIndex++ }
      );
      
      layerIds.push(layerId);
    });

    // Créer un groupe si plusieurs couches
    if (layerIds.length > 1 && fileName) {
      const groupName = fileName.replace(/\.(gml|xml)$/i, '');
      this.layerService.createLayerGroup(
        `group_${Date.now()}`,
        groupName,
        layerIds
      );
    }
  }

  private getFirstCoordinate(features: GeoFeature[]): { x: number; y: number } | null {
    for (const f of features) {
      if (f.coordinates && f.coordinates.length > 0) {
        const coord = f.coordinates[0];
        if (Array.isArray(coord) && coord.length > 0) {
          return coord[0] as { x: number; y: number };
        }
        return coord as { x: number; y: number };
      }
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // Drag & Drop
  // ═══════════════════════════════════════════════════════════════

  isDragging = signal(false);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.gml') || file.name.endsWith('.xml')) {
        this.loadGmlFile(file);
      } else {
        this.errorMessage.set('Veuillez déposer un fichier GML (.gml ou .xml)');
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Actions toolbar
  // ═══════════════════════════════════���═══════════════════════════

  onZoomIn(): void {
    this.mapService.zoomIn();
  }

  onZoomOut(): void {
    this.mapService.zoomOut();
  }

  onZoomToExtent(): void {
    this.layerService.zoomToAllLayers();
  }

  toggleLayerPanel(): void {
    this.isLayerPanelOpen.update(v => !v);
  }

  // ═══════════════════════════════════════════════════════════════
  // Gestion des couches (délégation)
  // ═══════════════════════════════════════════════════════════════

  onLayerVisibilityChange(layer: MapLayer): void {
    this.layerService.setLayerVisibility(layer.id, !layer.visible);
  }

  onLayerOpacityChange(event: { layerId: string; opacity: number }): void {
    this.layerService.setLayerOpacity(event.layerId, event.opacity);
  }

  onBaseMapChange(type: string): void {
    this.layerService.setBaseMap(type as any);
  }
}