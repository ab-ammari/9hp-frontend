import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-carto-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {

  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() zoomToExtent = new EventEmitter<void>();
  @Output() toggleLayers = new EventEmitter<void>();
  @Output() loadFile = new EventEmitter<void>();

  onZoomIn(): void {
    this.zoomIn.emit();
  }

  onZoomOut(): void {
    this.zoomOut.emit();
  }

  onZoomToExtent(): void {
    this.zoomToExtent.emit();
  }

  onToggleLayers(): void {
    this.toggleLayers.emit();
  }

  onLoadFile(): void {
    this.loadFile.emit();
  }
}
