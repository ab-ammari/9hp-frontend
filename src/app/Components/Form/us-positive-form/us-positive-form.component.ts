import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiTypeCategory, ApiUs, ApiUsPositive} from "../../../../../shared";
import {ImageType} from "../../Inputs/castor-type-selector/castor-type-selector.component";

@Component({
  selector: 'app-us-positive-form',
  templateUrl: './us-positive-form.component.html',
  styleUrls: ['./us-positive-form.component.scss']
})

export class UsPositiveFormComponent implements OnInit {

  @Input() us: ApiUsPositive;

  unSavedForm: boolean;

  ApiTypeCategory = ApiTypeCategory;

  imageDensityTypeMap: ImageType =
    {"267d483d-5948-40c8-a652-649ebf8facdf": "assets/images/image_type/densite_faible.png",
    "9b1a1670-7a29-4b79-aa64-09e277fcc5d4": "assets/images/image_type/densite_moyenne.png",
    "0bb4e27f-b8d6-426a-90b1-707842c8dcc9": "assets/images/image_type/densite_forte.png"
    };

  inclusionFields = [
    {
      typeKey: 'positive_inclusions_type_1',
      densityKey: 'positive_inclusions_granularite_1'
    },
    {
      typeKey: 'positive_inclusions_type_2',
      densityKey: 'positive_inclusions_granularite_2'
    },
    {
      typeKey: 'positive_inclusions_type_3',
      densityKey: 'positive_inclusions_granularite_3'
    },
  ];

  pertubationFields = [
    {
      typeKey: 'positive_perturbations_1',
    },
    {
      typeKey: 'positive_perturbations_2',
    },
    {
      typeKey: 'positive_perturbations_3',
    },
  ]

  constructor() { }

  ngOnInit(): void {
    this.initForm();
    this.initActiveRows();
  }

  initForm() {
  }

  initActiveRows() {
    // Initialiser les lignes actives en fonction des données existantes
    this.activeInclusionRows = [true, false, false];
    this.activePerturbationRows = [true, false, false];

    // Initialiser l'état de la composante secondaire
    this.secondNatureActive = !!this.us.positive_nature2;

    // Activer les lignes qui ont déjà des données
    for (let i = 1; i < this.inclusionFields.length; i++) {
      if (this.us[this.inclusionFields[i].typeKey]) {
        this.activeInclusionRows[i] = true;
      }
    }

    for (let i = 1; i < this.pertubationFields.length; i++) {
      if (this.us[this.pertubationFields[i].typeKey]) {
        this.activePerturbationRows[i] = true;
      }
    }
  }

  // Propriété pour suivre les lignes d'inclusion activées
  private activeInclusionRows: boolean[] = [true, false, false];

  shouldShowInclusionField(index: number): boolean {
    if (index === 0) {
      return true; // Toujours afficher la première ligne
    }
    return this.activeInclusionRows[index] || !!this.us[this.inclusionFields[index].typeKey];
  }

  // Propriété pour suivre les lignes de perturbation activées
  private activePerturbationRows: boolean[] = [true, false, false];

  // Propriété pour suivre l'activation de la composante secondaire
  private secondNatureActive: boolean = false;

  shouldShowPertubationField(index: number): boolean {
    if (index === 0) {
      return true; // Toujours afficher la première ligne
    }
    return this.activePerturbationRows[index] || !!this.us[this.pertubationFields[index].typeKey];
  }

  isLastVisibleInclusion(index: number): boolean {
    // Vérifier si c'est le dernier élément visible de la liste
    for (let i = index + 1; i < this.inclusionFields.length; i++) {
      if (this.shouldShowInclusionField(i)) {
        return false;
      }
    }
    return true;
  }

  isLastVisiblePerturbation(index: number): boolean {
    // Vérifier si c'est le dernier élément visible de la liste
    for (let i = index + 1; i < this.pertubationFields.length; i++) {
      if (this.shouldShowPertubationField(i)) {
        return false;
      }
    }
    return true;
  }

  onChangeForm() {
    this.resetDensityIfInclusionEmpty();
    if (this.unSavedForm) {
      return;
    } else {
     this.unSavedForm = true;
    }
  }

  private resetDensityIfInclusionEmpty(): void {
    this.inclusionFields.forEach(field => {
      const inclusionValue = this.us[field.typeKey];
      if (!inclusionValue) {
        this.us[field.densityKey] = null;
      }
    });
  }

  shouldShowDensity(field: any): boolean {
    return !!this.us[field.typeKey];
  }

  shouldShowSecondNature(): boolean {
    return this.secondNatureActive;
  }

  usPositiveNotValid(): boolean {
    return !(this.us?.positive_nature1
      && (this.us?.positive_inclusions_type_1|| this.us?.positive_inclusions_type_2 || this.us?.positive_inclusions_type_3)
      && this.us?.positive_durete && this.us?.positive_homogeneite
      && this.us?.positive_charbons && this.us?.positive_couleur);
  }

  // Méthodes pour gestion des boutons d'ajout

  // Positive Nature (max 2)
  canAddPositiveNature(): boolean {
    // Activer uniquement si la première nature est remplie
    return !!this.us.positive_nature1;
  }

  shouldShowPositiveNatureButton(): boolean {
    // Afficher le bouton uniquement si la composante secondaire n'est pas active
    return !this.secondNatureActive;
  }

  addPositiveNature(): void {
    if (!!this.us.positive_nature1 && !this.secondNatureActive) {
      // Activer la seconde nature
      this.secondNatureActive = true;
      // Initialiser à null pour le formulaire
      this.us.positive_nature2 = null;
      this.onChangeForm();
    }
  }

  // Inclusions (max 3)
  canAddInclusion(): boolean {
    // Activer uniquement si la dernière ligne active a une valeur
    const lastActiveIndex = this.activeInclusionRows.lastIndexOf(true);
    return !!this.us[this.inclusionFields[lastActiveIndex].typeKey];
  }

  shouldShowInclusionButton(): boolean {
    // Vérifier si on a atteint la limite max (3 inclusions)
    return this.activeInclusionRows.indexOf(false) !== -1;
  }

  addInclusion(): void {
    // Trouver le premier index inactif
    const nextIndex = this.activeInclusionRows.findIndex(active => !active);

    if (nextIndex !== -1 && nextIndex < 3) {
      // Activer cette ligne
      this.activeInclusionRows[nextIndex] = true;
      // Initialiser à null pour le formulaire
      this.us[this.inclusionFields[nextIndex].typeKey] = null;
      this.onChangeForm();
    }
  }

  // Perturbations (max 3)
  canAddPerturbation(): boolean {
    // Activer uniquement si la dernière ligne active a une valeur
    const lastActiveIndex = this.activePerturbationRows.lastIndexOf(true);
    return !!this.us[this.pertubationFields[lastActiveIndex].typeKey];
  }

  shouldShowPerturbationButton(): boolean {
    // Vérifier si on a atteint la limite max (3 perturbations)
    return this.activePerturbationRows.indexOf(false) !== -1;
  }

  addPerturbation(): void {
    // Trouver le premier index inactif
    const nextIndex = this.activePerturbationRows.findIndex(active => !active);

    if (nextIndex !== -1 && nextIndex < 3) {
      // Activer cette ligne
      this.activePerturbationRows[nextIndex] = true;
      // Initialiser à null pour le formulaire
      this.us[this.pertubationFields[nextIndex].typeKey] = null;
      this.onChangeForm();
    }
  }
}
