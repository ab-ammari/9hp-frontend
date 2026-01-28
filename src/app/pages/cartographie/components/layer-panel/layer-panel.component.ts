import { Component, Input, Output, EventEmitter } from '@angular/core';
import { LayerService } from '../../services/layer.service';
import { StyleService } from '../../services/style.service';
import { MapLayer, LayerGroup, BaseMapConfig } from '../../models/geo-feature.model';

@Component({
  selector: 'app-layer-panel',
  templateUrl: './layer-panel.component.html',
  styleUrls: ['./layer-panel.component.scss']
})
export class LayerPanelComponent {

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  // Onglet actif
  activeTab: 'layers' | 'basemaps' | 'style' = 'layers';

  // Couche sélectionnée pour modification de style
  selectedLayerForStyle: MapLayer | null = null;

  constructor(
    public layerService: LayerService,
    public styleService: StyleService
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // Gestion du panneau
  // ═══════════════════════════════════════════════════════════════

  onClose(): void {
    this.close.emit();
  }

  setActiveTab(tab: 'layers' | 'basemaps' | 'style'): void {
    this.activeTab = tab;
  }

  // ═══════════════════════════════════════════════════════════════
  // Gestion des couches
  // ═══════════════════════════════════════════════════════════════

  onVisibilityChange(layer: MapLayer): void {
    this.layerService.setLayerVisibility(layer.id, !layer.visible);
  }

  onOpacityChange(layer: MapLayer, event: Event): void {
    const input = event.target as HTMLInputElement;
    const opacity = parseFloat(input.value);
    this.layerService.setLayerOpacity(layer.id, opacity);
  }

  onZoomToLayer(layer: MapLayer): void {
    this.layerService.zoomToLayer(layer.id);
  }

  onRemoveLayer(layer: MapLayer): void {
    if (confirm(`Supprimer la couche "${layer.name}" ?`)) {
      this.layerService.removeLayer(layer.id);
    }
  }

  onMoveUp(layer: MapLayer): void {
    this.layerService.moveLayerUp(layer.id);
  }

  onMoveDown(layer: MapLayer): void {
    this.layerService.moveLayerDown(layer.id);
  }

  // ═════════════════════════════════════════════��═════════════════
  // Gestion des groupes
  // ═══════════════════════════════════════════════════════════════

  toggleGroupExpanded(group: LayerGroup): void {
    this.layerService.toggleGroupExpanded(group.id);
  }

  onGroupVisibilityChange(group: LayerGroup): void {
    this.layerService.setGroupVisibility(group.id, !group.visible);
  }

  getLayersInGroup(group: LayerGroup): MapLayer[] {
    return this.layerService.layers().filter(l => l.groupId === group.id);
  }

  getUngroupedLayers(): MapLayer[] {
    return this.layerService.layers().filter(l => !l.groupId);
  }

  // ═══════════════════════════════════════════════════════════════
  // Gestion des fonds de carte
  // ═══════════════════════════════════════════════════════════════

  onBaseMapChange(type: string): void {
    this.layerService.setBaseMap(type as any);
  }

  getBaseMaps(): BaseMapConfig[] {
    return this.layerService.getAvailableBaseMaps();
  }

  // ═══════════════════════════════════════════════════════════════
  // Gestion des styles
  // ═══════════════════════════════════════════════════════════════

  openStyleEditor(layer: MapLayer): void {
    this.selectedLayerForStyle = layer;
    this.activeTab = 'style';
  }

  closeStyleEditor(): void {
    this.selectedLayerForStyle = null;
    this.activeTab = 'layers';
  }

  onStyleColorChange(property: 'fill' | 'stroke', color: string): void {
    if (!this.selectedLayerForStyle?.gmlType) return;

    if (property === 'fill') {
      this.styleService.setCustomStyle(this.selectedLayerForStyle.gmlType, {
        fill: { color: this.hexToRgba(color, 0.4) }
      });
    } else {
      this.styleService.setCustomStyle(this.selectedLayerForStyle.gmlType, {
        stroke: { color }
      });
    }

    this.layerService.refreshLayerStyle(this.selectedLayerForStyle.id);
  }

  onStyleStrokeWidthChange(width: number): void {
    if (!this.selectedLayerForStyle?.gmlType) return;

    // Récupérer le style actuel pour conserver la couleur
    const currentStyle = this.styleService.getStyleConfig(this.selectedLayerForStyle.gmlType);
    const currentColor = currentStyle.stroke?.color || '#424242';

    this.styleService.setCustomStyle(this.selectedLayerForStyle.gmlType, {
      stroke: { color: currentColor, width }
    });

    this.layerService.refreshLayerStyle(this.selectedLayerForStyle.id);
  }

  onResetStyle(): void {
    if (!this.selectedLayerForStyle?.gmlType) return;

    this.styleService.resetStyle(this.selectedLayerForStyle.gmlType);
    this.layerService.refreshLayerStyle(this.selectedLayerForStyle.id);
  }

  // ═══════════════════════════════════════════════════════════════
  // Utilitaires
  // ═══════════════════════════════════════════════════════════════

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  trackByLayerId(index: number, layer: MapLayer): string {
    return layer.id;
  }

  trackByGroupId(index: number, group: LayerGroup): string {
    return group.id;
  }
}