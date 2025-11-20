import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-floating-action-button',
  templateUrl: './floating-action-button.component.html',
  styleUrls: ['./floating-action-button.component.scss']
})
export class FloatingActionButtonComponent {
  @Input() icon: string = 'settings-outline';
  @Input() color: string = 'secondary';
  @Input() position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right';
  @Input() offsetTop: string = '140px';
  @Input() offsetRight: string = '16px';
  @Input() offsetLeft: string = '16px';
  @Input() offsetBottom: string = '16px';
  @Input() label?: string;
  @Input() disabled: boolean = false;

  @Output() fabClick = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled) {
      this.fabClick.emit();
    }
  }

  getPositionStyles(): any {
    const styles: any = {
      position: 'fixed',
      'z-index': 1000
    };

    switch (this.position) {
      case 'top-right':
        styles.top = this.offsetTop;
        styles.right = this.offsetRight;
        break;
      case 'top-left':
        styles.top = this.offsetTop;
        styles.left = this.offsetLeft;
        break;
      case 'bottom-right':
        styles.bottom = this.offsetBottom;
        styles.right = this.offsetRight;
        break;
      case 'bottom-left':
        styles.bottom = this.offsetBottom;
        styles.left = this.offsetLeft;
        break;
    }

    return styles;
  }
}
