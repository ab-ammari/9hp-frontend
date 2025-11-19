import {Component, Input} from '@angular/core';
import {
  ApiUsConstruite,
  ApiTypeCategory,
  ApiDbTable,
  ApiUsConstruiteLiantNodules, ApiUsConstruiteLiantInclusions
} from "../../../../../../shared";
import {UsCheckbox} from "../us-construite-form.component";

@Component({
  selector: 'app-liant-form',
  templateUrl: './liant-form.component.html',
  styleUrls: ['./liant-form.component.scss']
})
export class LiantFormComponent {

  @Input() us: ApiUsConstruite;

  protected readonly ApiTypeCategory = ApiTypeCategory;

  // Liant nodule
  liantNoduleTypeToAdd: string;
  liantNoduleQuantiteToAdd: string;
  liantNoduleDimensionsToAdd: string;

  // Liant inclusion
  liantInclusionNatureToAdd: string;
  liantInclusionFrequenceToAdd: string;

  // Liant charge
  chargeCheckbox: Array<UsCheckbox> = [
    {value: false, checkBoxLabel: 'Limon'},
    {value: false, checkBoxLabel: 'Sable (< 2 mm)'},
    {value: false, checkBoxLabel: 'Petits graviers (2-10 mm)'},
    {value: false, checkBoxLabel: 'Gros graviers (10-20 mm)'},
    {value: false, checkBoxLabel: 'Cailloux (> 20 mm)'},
  ];

  ngOnInit() {
    // Initialiser us_liant_charge si nécessaire
    if (!this.us.us_liant_charge) {
      this.us.us_liant_charge = {
        charge_limon: false,
        charge_sable: false,
        charge_petit_graviers: false,
        charge_gros_graviers: false,
        charge_cailloux: false
      };
    } else {
      // Synchroniser les checkbox avec les valeurs existantes
      this.syncCheckboxesWithUsValue();
    }
  }

  // Synchroniser les checkbox avec les valeurs de us_liant_charge
  syncCheckboxesWithUsValue() {
    if (this.us.us_liant_charge) {
      this.chargeCheckbox.forEach(checkbox => {
        switch (checkbox.checkBoxLabel) {
          case 'Limon':
            checkbox.value = this.us.us_liant_charge.charge_limon;
            break;
          case 'Sable (< 2 mm)':
            checkbox.value = this.us.us_liant_charge.charge_sable;
            break;
          case 'Petits graviers (2-10 mm)':
            checkbox.value = this.us.us_liant_charge.charge_petit_graviers;
            break;
          case 'Gros graviers (10-20 mm)':
            checkbox.value = this.us.us_liant_charge.charge_gros_graviers;
            break;
          case 'Cailloux (> 20 mm)':
            checkbox.value = this.us.us_liant_charge.charge_cailloux;
            break;
        }
      });
    }
  }

  updateUsOnCheckboxChange() {
    // Initialiser us_liant_charge s'il n'existe pas
    if (!this.us.us_liant_charge) {
      this.us.us_liant_charge = {
        charge_limon: false,
        charge_sable: false,
        charge_petit_graviers: false,
        charge_gros_graviers: false,
        charge_cailloux: false
      };
    }

    this.chargeCheckbox.forEach(checkbox => {
      switch (checkbox.checkBoxLabel) {
        case 'Limon':
          this.us.us_liant_charge.charge_limon = checkbox.value;
          break;
        case 'Sable (< 2 mm)':
          this.us.us_liant_charge.charge_sable = checkbox.value;
          break;
        case 'Petits graviers (2-10 mm)':
          this.us.us_liant_charge.charge_petit_graviers = checkbox.value;
          break;
        case 'Gros graviers (10-20 mm)':
          this.us.us_liant_charge.charge_gros_graviers = checkbox.value;
          break;
        case 'Cailloux (> 20 mm)':
          this.us.us_liant_charge.charge_cailloux = checkbox.value;
          break;
        default:
          console.log('default');
          break;
      }
      console.log(this.us.us_liant_charge);
    })
  }

  isDisplayLiantFields(): boolean {
    return this.us.us_liant_type !== undefined && this.us.us_liant_type !== "c54ac8e3-cd70-4fd5-9b96-57b0211e6d17";
  }

  // Liant nodule array function
  isLiantNoduleValid(): boolean {
    return !!this.liantNoduleDimensionsToAdd
      && !!this.liantNoduleQuantiteToAdd
      && !!this.liantNoduleTypeToAdd;
  }

  deleteLiantNodule(nodule: ApiUsConstruiteLiantNodules, index: number) {
    nodule.live = false;
  }

  addLiantNodule() {
    if (!this.us?.us_liant_nodules) {
      this.us.us_liant_nodules = [];
    }
    this.us?.us_liant_nodules.push({
      author_uuid: this.us.author_uuid,
      live: true,
      projet_uuid: this.us.projet_uuid,
      table: ApiDbTable.us_fourrure,
      created: 0,
      versions: [],
      us_liant_nodule_type: this.liantNoduleTypeToAdd,
      us_liant_nodule_quantites: this.liantNoduleQuantiteToAdd,
      us_liant_nodule_dimensions: this.liantNoduleDimensionsToAdd,
    });
    this.cleanLiantNoduleVar();
  }

  cleanLiantNoduleVar() {
    this.liantNoduleTypeToAdd = null;
    this.liantNoduleQuantiteToAdd = null;
    this.liantNoduleDimensionsToAdd = null;
  }

  // ======= END =======

  // Liant inclusion array function
  isLiantInclusionValid(): boolean {
    return !!this.liantInclusionNatureToAdd && !!this.liantInclusionFrequenceToAdd;
  }

  deleteLiantInclusion(inclusion: ApiUsConstruiteLiantInclusions, index: number) {
    inclusion.live = false;
  }

  addLiantInclusion() {
    if (!this.us?.us_liant_inclusions) {
      this.us.us_liant_inclusions = [];
    }
    this.us?.us_liant_inclusions.push({
      author_uuid: this.us.author_uuid,
      live: true,
      projet_uuid: this.us.projet_uuid,
      table: ApiDbTable.us_fourrure,
      created: 0,
      versions: [],
      us_liant_inclusions_nature: this.liantInclusionNatureToAdd,
      us_liant_inclusions_frequence: this.liantInclusionFrequenceToAdd,
    });
    this.cleanLiantInclusionVar();
  }

  cleanLiantInclusionVar() {
    this.liantNoduleTypeToAdd = null;
    this.liantNoduleQuantiteToAdd = null;
    this.liantNoduleDimensionsToAdd = null;
  }
}
