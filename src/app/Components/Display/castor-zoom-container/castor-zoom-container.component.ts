import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-castor-zoom-container',
  templateUrl: './castor-zoom-container.component.html',
  styleUrls: ['./castor-zoom-container.component.scss']
})
export class CastorZoomContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('zoomContainer') zoomContainer: ElementRef;
  @ViewChild('zoomImgWrapper') zoomImgWrapper: ElementRef;

  // Zoom state variables
  private scale = 1;
  private minScale = 0.5;
  private maxScale = 5;
  private posX = 0;
  private posY = 0;
  private startX = 0;
  private startY = 0;
  private lastPosX = 0;
  private lastPosY = 0;
  private lastDistance = 0;
  private isDragging = false;
  private eventListeners: { element: HTMLElement | Window, type: string, listener: EventListener }[] = [];

  constructor() {}

  ngAfterViewInit(): void {
    this.setupZoom();
  }

  ngOnDestroy(): void {
    // Remove all event listeners when component is destroyed
    this.removeAllEventListeners();
  }

  private setupZoom(): void {
    const container = this.zoomContainer.nativeElement;
    const wrapper = this.zoomImgWrapper.nativeElement;

    // Add event listeners for mouse wheel zoom
    this.addEventListenerWithCleanup(container, 'wheel', this.handleWheel.bind(this));

    // Add event listeners for touch events (pinch zoom and pan)
    this.addEventListenerWithCleanup(container, 'touchstart', this.handleTouchStart.bind(this));
    this.addEventListenerWithCleanup(container, 'touchmove', this.handleTouchMove.bind(this));
    this.addEventListenerWithCleanup(container, 'touchend', this.handleTouchEnd.bind(this));

    // Add event listeners for mouse events (drag)
    this.addEventListenerWithCleanup(container, 'mousedown', this.handleMouseDown.bind(this));
    this.addEventListenerWithCleanup(window, 'mousemove', this.handleMouseMove.bind(this));
    this.addEventListenerWithCleanup(window, 'mouseup', this.handleMouseUp.bind(this));

    // Double click to reset zoom
    this.addEventListenerWithCleanup(container, 'dblclick', this.resetZoom.bind(this));
  }

  private addEventListenerWithCleanup(element: HTMLElement | Window, type: string, listener: EventListener): void {
    element.addEventListener(type, listener, { passive: false });
    this.eventListeners.push({ element, type, listener });
  }

  private removeAllEventListeners(): void {
    this.eventListeners.forEach(({ element, type, listener }) => {
      element.removeEventListener(type, listener);
    });
    this.eventListeners = [];
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();

    const delta = -Math.sign(event.deltaY) * 0.1;
    const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale + delta));

    // Calculate zoom point (relative to the center)
    const rect = this.zoomContainer.nativeElement.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    // Apply zoom centered on mouse position
    this.zoomToPoint(newScale, offsetX, offsetY);
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();

    if (event.touches.length === 1) {
      // Single touch - start dragging
      this.isDragging = true;
      this.startX = event.touches[0].clientX - this.posX;
      this.startY = event.touches[0].clientY - this.posY;
    }
    else if (event.touches.length === 2) {
      // Pinch gesture - calculate initial distance
      this.lastDistance = this.getDistanceBetweenTouches(event);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();

    if (event.touches.length === 1 && this.isDragging) {
      // Single touch - pan
      this.posX = event.touches[0].clientX - this.startX;
      this.posY = event.touches[0].clientY - this.startY;
      this.applyTransform();
    }
    else if (event.touches.length === 2) {
      // Pinch gesture - zoom
      const currentDistance = this.getDistanceBetweenTouches(event);
      const delta = currentDistance / this.lastDistance;

      // Calculate center point of the two touches
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      // Calculate zoom point (relative to the container)
      const rect = this.zoomContainer.nativeElement.getBoundingClientRect();
      const offsetX = centerX - rect.left;
      const offsetY = centerY - rect.top;

      // Apply zoom
      const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * delta));
      this.zoomToPoint(newScale, offsetX, offsetY);

      this.lastDistance = currentDistance;
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    this.isDragging = false;
    this.lastPosX = this.posX;
    this.lastPosY = this.posY;
  }

  private handleMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.startX = event.clientX - this.posX;
    this.startY = event.clientY - this.posY;
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    event.preventDefault();
    this.posX = event.clientX - this.startX;
    this.posY = event.clientY - this.startY;
    this.applyTransform();
  }

  private handleMouseUp(event: MouseEvent): void {
    this.isDragging = false;
    this.lastPosX = this.posX;
    this.lastPosY = this.posY;
  }

  private getDistanceBetweenTouches(event: TouchEvent): number {
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private zoomToPoint(newScale: number, pointX: number, pointY: number): void {
    // Calculate how much the zoom is changing
    const scaleDelta = newScale / this.scale;

    // Calculate the new position to keep the zoom centered on the mouse/touch point
    const containerWidth = this.zoomContainer.nativeElement.clientWidth;
    const containerHeight = this.zoomContainer.nativeElement.clientHeight;

    // Calculate the point position relative to the center
    const relX = pointX - containerWidth / 2;
    const relY = pointY - containerHeight / 2;

    // Adjust position based on the zoom change
    this.posX = scaleDelta * (this.posX - relX) + relX;
    this.posY = scaleDelta * (this.posY - relY) + relY;

    // Update scale
    this.scale = newScale;

    // Apply the transformation
    this.applyTransform();
  }

  private applyTransform(): void {
    const wrapper = this.zoomImgWrapper.nativeElement;
    wrapper.style.transform = `translate(${this.posX}px, ${this.posY}px) scale(${this.scale})`;
  }

  public resetZoom(): void {
    this.scale = 1;
    this.posX = 0;
    this.posY = 0;
    this.applyTransform();
  }
}
