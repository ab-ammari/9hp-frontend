import {Component, Input, OnInit} from '@angular/core';
import {ApiDbTable, ApiSyncableObject} from "../../../../../shared";
import {tableDescription} from "../../../DataClasses/models/sync-obj-utilities";
import {CastorUtilitiesService} from "../../../services/castor-utilities.service";

interface ObjectInfoDisplay {
  label: string;
  key: string;
  valueType: 'string' | 'tag' | 'type' | 'boolean' | 'dimension' | 'number' | 'date';
  dimensionType?: 'classic' | 'surface' | 'volume';
  tagTable?: ApiDbTable;
}

@Component({
  selector: 'app-castor-generic-object-info-display',
  templateUrl: './castor-generic-object-info-display.component.html',
  styleUrls: ['./castor-generic-object-info-display.component.scss']
})
export class CastorGenericObjectInfoDisplayComponent implements OnInit {

  @Input() object: ApiSyncableObject;
  @Input() info: tableDescription;

  infoToDisplay: Array<ObjectInfoDisplay> = [];

  constructor(public utils: CastorUtilitiesService) { }

  ngOnInit(): void {
    this.initInfo();
  }

  initInfo() {
    if (this.object && this.info) {
      if (this.info.ref_table === ApiDbTable.us) {
        this.infoToDisplay.push(
          {label: 'Secteur', key: 'secteur_uuid', valueType: 'tag', tagTable: ApiDbTable.secteur},
          {label: 'Fait', key: 'fait_uuid', valueType: 'tag', tagTable: ApiDbTable.fait},
          {label: 'Identification', key: 'us_identification_uuid', valueType: 'type'},
          {label: 'Etat', key: 'us_stat', valueType: 'type'},
          {label: 'Precision', key: 'us_precision', valueType: 'string'},
          {label: 'Longeur (m)', key: 'us_dim_longeur', valueType: 'dimension', dimensionType: 'classic'},
          {label: 'Largeur (m)', key: 'us_dim_largeur', valueType: 'dimension', dimensionType: 'classic'},
          {label: 'Hauteur (m)', key: 'us_dim_hauteur', valueType: 'dimension', dimensionType: 'classic'},
        );
      } else {
        switch (this.info.obj_table) {
          case ApiDbTable.secteur:
            this.infoToDisplay.push(
              {label: 'Type', key: 'secteur_type', valueType: 'string'},
              {label: 'Longeur (m)', key: 'secteur_dim_longeur', valueType: 'dimension'},
              {label: 'Largeur (m)', key: 'secteur_dim_largeur', valueType: 'dimension'},
              {label: 'Profondeur (m)', key: 'secteur_dim_profondeur', valueType: 'dimension'},
              {label: 'Superficie (m²)', key: 'secteur_dim_surface', valueType: 'dimension', dimensionType: 'surface'},
              {label: 'Volume (m³)', key: 'secteur_dim_volume', valueType: 'dimension', dimensionType: 'volume'},
            );
            break;
          case ApiDbTable.contenant:
            this.infoToDisplay.push(
              {label: 'Etat', key: 'contenant_stat', valueType: 'string'},
              {label: 'Position', key: 'contenant_position', valueType: 'string'},
              {label: 'Poids total (kg)', key: 'contenant_total_weight', valueType: 'string'},
              {label: 'Type', key: 'type_contenant_uuid', valueType: 'type'},
              {label: 'Secteur', key: 'secteur_uuid', valueType: 'tag', tagTable: ApiDbTable.secteur},
            );
            break;
          case ApiDbTable.document_photo:
            this.infoToDisplay.push(
              {label: 'Label', key: 'photo_label', valueType: 'string'},
              {label: 'Plaque', key: 'photo_plaque', valueType: 'boolean'},
              {label: 'Type', key: 'photo_type_uuid', valueType: 'type'},
              {label: 'Vue vers', key: 'photo_vue_vers', valueType: 'type'},
            );
            break;
          case ApiDbTable.document_minute:
            this.infoToDisplay.push(
              {label: 'Support', key: 'minute_support', valueType: 'type'},
              {label: 'Etat', key: 'minute_state_uuid', valueType: 'type'},
            );
            break;
          case ApiDbTable.echantillon_mobilier:
            this.infoToDisplay.push(
              {label: 'US', key: 'us_uuid', valueType: 'tag', tagTable: ApiDbTable.us},
              {label: 'Datation', key: 'mobilier_datation_uuid', valueType: 'type'},
              {label: 'Materiau', key: 'type_materiaux_uuid', valueType: 'type'},
              {label: 'Etat', key: 'mobilier_etat_uuid', valueType: 'type'},
              {label: 'Identification', key: 'mobilier_identification_uuid', valueType: 'type'},
              {label: 'Type', key: 'mobilier_type_uuid', valueType: 'type'},
              {label: 'NR', key: 'mobilier_nr', valueType: 'string'},
              {label: 'PR', key: 'mobilier_pr', valueType: 'string'},
              {label: 'Position', key: 'mobilier_position', valueType: 'string'},
            );
            break;
          case ApiDbTable.echantillon_prelevement:
            this.infoToDisplay.push(
              {label: 'US', key: 'us_uuid', valueType: 'tag', tagTable: ApiDbTable.us},
              {label: 'Etat', key: 'prelevement_etat', valueType: 'type'},
              {label: 'Quantité', key: 'prelevement_quantite', valueType: 'type'},
              {label: 'Nature', key: 'type_nature_uuid', valueType: 'type'},
              {label: 'Analyse', key: 'prelevement_analyse', valueType: 'type'},
            );
            break;
          case ApiDbTable.ensemble:
            this.infoToDisplay.push(
              {label: 'Identification', key: 'ensemble_identification_uuid', valueType: 'type'},
              {label: 'Precisions', key: 'ensemble_precisions', valueType: 'string'},
              {label: 'Largeur (m)', key: 'ensemble_dim_largeur', valueType: 'dimension'},
              {label: 'Longeur (m)', key: 'ensemble_dim_longeur', valueType: 'dimension'},
              {label: 'Superficie (m²)', key: 'ensemble_dim_superficie', valueType: 'dimension', dimensionType: 'surface'},
              {label: 'Datation', key: 'ensemble_datation_uuid', valueType: 'type'},
            );
            break;
          case ApiDbTable.fait:
            this.infoToDisplay.push(
              {label: 'Secteur', key: 'secteur_uuid', valueType: 'tag', tagTable: ApiDbTable.secteur},
              {label: 'Precisions', key: 'fait_precision', valueType: 'string'},
              {label: 'Identification', key: 'fait_identification_uuid', valueType: 'type'},
              {label: 'Etat', key: 'fait_stat_uuid', valueType: 'type'},
              {label: 'Validation', key: 'fait_validation', valueType: 'boolean'},
              {label: 'Longeur (m)', key: 'fait_dim_longueur', valueType: 'dimension', dimensionType: 'classic'},
              {label: 'Largeur (m)', key: 'fait_dim_largeur', valueType: 'dimension', dimensionType: 'classic'},
              {label: 'Hauteur (m)', key: 'fait_dim_hauteur', valueType: 'dimension', dimensionType: 'classic'},
              {label: 'Diametre (m)', key: 'fait_dim_diameter', valueType: 'dimension', dimensionType: 'classic'},
              {label: 'Calage poteau', key: 'fait_calage_poteau', valueType: 'boolean'},
              {label: 'Form plan', key: 'fait_form_plan', valueType: 'type'},
              {label: 'Form profile', key: 'fait_form_profile', valueType: 'type'},
            );
            break;
          case ApiDbTable.section_sondage:
            this.infoToDisplay.push(
              {label: 'Longeur (m)', key: 'section_dim_longeur', valueType: 'dimension'},
              {label: 'Largeur (m)', key: 'section_dim_largeur', valueType: 'dimension'},
              {label: 'Profondeur (m)', key: 'section_dim_profondeur', valueType: 'dimension'},
              {label: 'Superficie (m²)', key: 'section_dim_superficie', valueType: 'dimension', dimensionType: 'surface'},
              {label: 'Volume (m³)', key: 'section_dim_volume', valueType: 'dimension', dimensionType: 'volume'},
              {label: 'Type', key: 'section_type', valueType: 'type'},
              {label: 'zInf', key: 'section_z_inf', valueType: 'number'},
              {label: 'zSup', key: 'section_z_sup', valueType: 'number'},
            );
            break;
          case ApiDbTable.section_coupe:
            this.infoToDisplay.push(
              {label: 'Sondage', key: 'section_sondage_uuid', valueType: 'tag', tagTable: ApiDbTable.section_sondage},
              {label: 'Type', key: 'section_type', valueType: 'type'},
              {label: 'Longeur (m)', key: 'section_dim_longeur', valueType: 'dimension'},
              {label: 'Largeur (m)', key: 'section_dim_largeur', valueType: 'dimension'},
              {label: 'Profondeur (m)', key: 'section_dim_profondeur', valueType: 'dimension'},
              {label: 'Superficie (m²)', key: 'section_dim_superficie', valueType: 'dimension', dimensionType: 'surface'},
              {label: 'Volume (m³)', key: 'section_dim_volume', valueType: 'dimension', dimensionType: 'volume'},
            );
            break;
          case ApiDbTable.topo:
            this.infoToDisplay.push(
              {label: 'Type', key: 'topo_type_uuid', valueType: 'type'},
              {label: 'Levée', key: 'topo_levee', valueType: 'boolean'},
              {label: 'Loc x', key: 'topo_loc_x', valueType: 'number'},
              {label: 'Loc y', key: 'topo_loc_y', valueType: 'number'},
              {label: 'Loc z', key: 'topo_loc_z', valueType: 'number'},
            );
            break;
        }
      }
    }
  }

}
