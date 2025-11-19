import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-technical-settings',
  templateUrl: './technical-settings.component.html',
  styleUrls: ['./technical-settings.component.scss']
})
export class TechnicalSettingsComponent implements OnInit {

  // Validation stratigraphique
  enableStratiValidation: boolean;
  autoStratiValidation: boolean;
  showStratiIcon: boolean;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.enableStratiValidation = localStorage.getItem('enableStratiValidation') !== 'false';
    this.autoStratiValidation = localStorage.getItem('autoStratiValidation') === 'true';
    this.showStratiIcon = localStorage.getItem('showStratiIcon') === 'true';
  }

  toggleStratiValidation(): void {
    localStorage.setItem('enableStratiValidation', this.enableStratiValidation.toString());
    if (!this.enableStratiValidation) {
      this.autoStratiValidation = false;
      localStorage.setItem('autoStratiValidation', 'false');
    }
  }

  toggleAutoStratiValidation(): void {
    localStorage.setItem('autoStratiValidation', this.autoStratiValidation.toString());
  }

  toggleStratiIcon(): void {
    localStorage.setItem('showStratiIcon', this.showStratiIcon.toString());
  }

  close(): void {
    this.modalCtrl.dismiss();
  }

  resetToDefaults(): void {
    this.enableStratiValidation = true;
    this.autoStratiValidation = false;
    this.showStratiIcon = false;
    
    localStorage.setItem('enableStratiValidation', 'true');
    localStorage.setItem('autoStratiValidation', 'false');
    localStorage.setItem('showStratiIcon', 'false');
  }
}
