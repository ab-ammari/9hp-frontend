import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-floating-panel',
  templateUrl: './floating-panel.component.html',
  styleUrls: ['./floating-panel.component.scss'],
  animations: [
    trigger('backdropAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('panelAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),
        animate('250ms cubic-bezier(0.4, 0. 0, 0.2, 1)', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0. 4, 0.0, 1, 1)', style({ transform: 'scale(0.9)', opacity: 0 }))
      ])
    ])
  ]
})
export class FloatingPanelComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() position: 'right' | 'left' | 'center' = 'right';
  @Input() width: string = '400px';
  @Input() maxWidth: string = '90vw';
  @Input() showBackdrop: boolean = true;
  @Input() allowBackgroundInteractions: boolean = false; // 🆕 NOUVEAU

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    // Ne fermer que si showBackdrop est true
    if (this.showBackdrop && (event.target as HTMLElement).classList.contains('panel-backdrop')) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    // Ne fermer avec Escape que si showBackdrop est true
    if (this.isOpen && this.showBackdrop) {
      this.close();
    }
  }

  getPanelClass(): string {
    return `panel-${this.position}`;
  }
}
