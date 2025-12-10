import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { trigger, style, transition, animate } from '@angular/animations';

export interface EntityInfo {
  uuid: string;
  label: string;
  type: 'us' | 'fait';
}

export interface DeleteConfirmationData {
  sourceEntity: EntityInfo;
  targetEntity: EntityInfo;
  isContemporary: boolean;
  relationUuid: string;
}

@Component({
  selector: 'app-delete-confirmation-dialog',
  templateUrl: './delete-confirmation-dialog.component.html',
  styleUrls:  ['./delete-confirmation-dialog.component.scss'],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(': leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('dialogAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9) translateY(-10px)' }),
        animate('250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in',
          style({ opacity: 0, transform: 'scale(0.9) translateY(-10px)' }))
      ])
    ])
  ]
})
export class DeleteConfirmationDialogComponent {

  // Visibility
  @Input() isVisible: boolean = false;
  @Input() isLoading: boolean = false;

  // Position
  @Input() positionX: number = 0;
  @Input() positionY: number = 0;

  // Content
  @Input() title: string = 'Supprimer cette relation ?';
  @Input() message: string = '';
  @Input() sourceEntity: EntityInfo | null = null;
  @Input() targetEntity: EntityInfo | null = null;
  @Input() isContemporary: boolean = false;

  // Button texts
  @Input() confirmText: string = 'Supprimer';
  @Input() cancelText: string = 'Annuler';
  @Input() loadingText: string = 'Suppression... ';

  // Events
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  // Fermer avec Escape
  @HostListener('document: keydown.escape')
  onEscapeKey(): void {
    if (this.isVisible && !this.isLoading) {
      this.onCancel();
    }
  }

  getPositionStyle(): { [key: string]:  string } {
    // Ajuster la position pour éviter de sortir de l'écran
    const adjustedX = Math.min(this.positionX, window.innerWidth - 340);
    const adjustedY = Math. min(this.positionY, window. innerHeight - 250);

    return {
      'left': `${Math.max(10, adjustedX)}px`,
      'top': `${Math.max(10, adjustedY)}px`
    };
  }

  onConfirm(): void {
    if (! this.isLoading) {
      this.confirmed.emit();
    }
  }

  onCancel(): void {
    if (!this.isLoading) {
      this.cancelled.emit();
    }
  }
}
