import { Component, Input } from '@angular/core';
import { LayerService } from '../../services/layer.service';
import { StyleService } from '../../services/style.service';
import { MapLayer } from '../../models/geo-feature.model';

@Component({
  selector: 'app-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.scss']
})
export class LegendComponent {

  @Input() collapsed = false;

  constructor(
    public layerService: LayerService,
    public styleService: StyleService
  ) {}

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }

  getVisibleLayers(): MapLayer[] {
    return this.layerService.layers().filter(l => l.visible);
  }

  getLayerStyle(layer: MapLayer): any {
    if (!layer.gmlType) return {};
    const config = this.styleService.getStyleConfig(layer.gmlType);
    return {
      backgroundColor: config.fill?.color || 'transparent',
      borderColor: config.stroke?.color || '#333',
      borderWidth: (config.stroke?.width || 2) + 'px'
    };
  }

  trackByLayerId(index: number, layer: MapLayer): string {
    return layer.id;
  }
}