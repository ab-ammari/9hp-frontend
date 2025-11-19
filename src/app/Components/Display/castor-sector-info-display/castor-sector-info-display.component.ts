import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiSecteur} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {CastorUtilitiesService} from "../../../services/castor-utilities.service";

@Component({
  selector: 'app-castor-sector-info-display',
  templateUrl: './castor-sector-info-display.component.html',
  styleUrls: ['./castor-sector-info-display.component.scss']
})
export class CastorSectorInfoDisplayComponent implements OnInit, OnChanges {

  @Input() secteurUuid: string;
  secteur: ApiSecteur;

  secteurInfo: Array<{label: string; value: string}>;

  constructor(private w: WorkerService, private utils: CastorUtilitiesService) { }

  ngOnInit(): void {
    this.initData();
  }

  initData() {
    if (this.secteurUuid) {
      this.secteur = this.w.data().objects?.secteur?.all?.list
        ?.find(secteur => secteur.item.secteur_uuid === this.secteurUuid)?.item;
      if (this.secteur) {
        this.initInfo();
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.secteurUuid) {
      this.initData();
    }
  }

  initInfo() {
    this.secteurInfo = [
      {label: 'Tag', value: this.secteur.tag },
      {label: 'Type', value: this.secteur.secteur_type },
      {label: 'Longeur (m)', value: this.utils.dimensionToMeter(this.secteur.secteur_dim_longeur)?.toString() },
      {label: 'Largeur (m)', value: this.utils.dimensionToMeter(this.secteur.secteur_dim_largeur)?.toString() },
      {label: 'Profondeur (m)', value: this.utils.dimensionToMeter(this.secteur.secteur_dim_profondeur)?.toString() },
      {label: 'Surperficie (m²)', value: this.utils.dimensionToMeter(this.secteur.secteur_dim_surface, 'surface')?.toString() },
      {label: 'Volume (m³)', value: this.utils.dimensionToMeter(this.secteur.secteur_dim_volume, 'volume')?.toString() },
    ];
  }

}
