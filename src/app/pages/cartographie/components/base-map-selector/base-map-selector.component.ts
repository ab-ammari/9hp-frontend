import { Component } from '@angular/core';
import { LayerService } from '../../services/layer.service';
import { BaseMapConfig, BaseMapType } from '../../models/geo-feature.model';

@Component({
  selector: 'app-base-map-selector',
  templateUrl: './base-map-selector.component.html',
  styleUrls: ['./base-map-selector.component.scss']
})
export class BaseMapSelectorComponent {

  isExpanded = false;

  constructor(public layerService: LayerService) {}

  toggle(): void {
    this.isExpanded = !this.isExpanded;
  }

  selectBaseMap(type: BaseMapType): void {
    this.layerService.setBaseMap(type);
    this.isExpanded = false;
  }

  getBaseMaps(): BaseMapConfig[] {
    return this.layerService.getAvailableBaseMaps().filter(b => b.type !== 'none');
  }

  getCurrentBaseMapName(): string {
    const current = this.layerService.currentBaseMap();
    return this.layerService.baseMapConfigs[current]?.name || 'Aucun';
  }
}