import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CursorPosition } from '../../models/geo-feature.model';

@Component({
  selector: 'app-carto-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.scss']
})
export class StatusBarComponent {

  @Input() coordinates: CursorPosition | null = null;
  @Input() zoom: number = 15;
  @Input() crs: string = 'EPSG:2154';
  @Input() featureCount: number = 0;

  @Output() crsChange = new EventEmitter<string>();

  availableCRS = [
    { code: 'EPSG:2154', name: 'Lambert 93' },
    { code: 'EPSG:4326', name: 'WGS 84' },
    { code: 'EPSG:3857', name: 'Web Mercator' }
  ];

  onCrsChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.crsChange.emit(select.value);
  }

  formatCoordinate(value: number | undefined): string {
    if (value === undefined || value === null) return '—';
    return value.toFixed(3);
  }
}
