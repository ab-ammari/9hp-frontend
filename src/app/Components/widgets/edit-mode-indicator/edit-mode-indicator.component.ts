import { Component, Input, Output, EventEmitter } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-edit-mode-indicator',
  templateUrl: './edit-mode-indicator.component.html',
  styleUrls:  ['./edit-mode-indicator.component.scss'],
  animations: [
    trigger('slideAnimation', [
      transition(': enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity:  1, transform:  'translateY(0)' }))
      ]),
      transition(': leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class EditModeIndicatorComponent {

  @Input() isVisible: boolean = false;
  @Input() message: string = 'Mode Édition - Cliquez sur une flèche pour la supprimer';
  @Input() icon: string = 'create';
  @Input() color: 'primary' | 'warning' | 'danger' | 'success' = 'warning';

  @Output() closed = new EventEmitter<void>();

  isMinimized: boolean = false;

  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
  }

  onClose(): void {
    this.closed. emit();
  }
}
