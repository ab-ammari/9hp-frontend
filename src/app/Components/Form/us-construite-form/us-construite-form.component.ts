import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ApiDbTable, ApiTypeCategory, ApiUsConstruite, ApiUsMaterial} from "../../../../../shared";
import {IonModal} from "@ionic/angular";
import {LOG, LoggerContext} from "ngx-wcore";
import {WorkerService} from "../../../services/worker.service";
import {v4} from "uuid";
import {UsMortarTypeEnum} from "../../../../../shared/objects/models/enums/UsMortarTypeEnum";


const CONTEXT: LoggerContext = {
  origin: 'UsConstruiteFormComponent'
}

export interface UsCheckbox {
  value: boolean;
  checkBoxLabel: string;
}

@Component({
  selector: 'app-us-construite-form',
  templateUrl: './us-construite-form.component.html',
  styleUrls: ['./us-construite-form.component.scss']
})
export class UsConstruiteFormComponent implements OnInit {

  @ViewChild('materialsModal') materialModal: IonModal;
  @ViewChild('construiteModal') construiteModal: IonModal;

  @Input() us: ApiUsConstruite;

  unSaveForm: boolean;
  @Output() unSaveFormChange = new EventEmitter();

  /* Material form value */
  nature: string;
  percent: string;
  modules: string;
  largeurMin: number;
  largeurMax: number;
  largeurMoy: number;
  hauteurMin: number;
  hauteurMax: number;
  hauteurMoy: number;
  profondeurMin: number;
  profondeurMax: number;
  profondeurMoy: number;

  /* Mortal form */
  hardness: string;
  color: string;
  inclusionsCheckbox: Array<UsCheckbox> = [
    {value: false, checkBoxLabel: 'Sable'},
    {value: false, checkBoxLabel: 'Gravier'},
    {value: false, checkBoxLabel: 'Cailloutis'},
    {value: false, checkBoxLabel: 'Nodules d\'argile'},
    {value: false, checkBoxLabel: 'Nodules de chaux'},
    {value: false, checkBoxLabel: 'TCA'},
    {value: false, checkBoxLabel: 'Charbons'},
    {value: false, checkBoxLabel: 'Matière végétale'},
  ];
  ApiTypeCategory = ApiTypeCategory;
  UsMortarTypeEnum = UsMortarTypeEnum;

  constructor(
    private w: WorkerService
  ) {
  }

  ngOnInit(): void {
  }

  presentModal() {
    this.materialModal?.present();
  }

  closeModal() {
    this.materialModal?.dismiss();
  }

  presentConstModal() {
    this.construiteModal?.present();
  }

  closeConstModal() {
    this.construiteModal?.dismiss();
  }

  addMaterial() {
    const nature = this.nature;
    const pourcent = this.percent;
    const modules = this.modules;
    const largeurMin = this.largeurMin;
    const largeurMax = this.largeurMax;
    const largeurMoy = this.largeurMoy;
    const hauteurMin = this.hauteurMin;
    const hauteurMax = this.hauteurMax;
    const hauteurMoy = this.hauteurMoy;
    const profondeurMin = this.profondeurMin;
    const profondeurMax = this.profondeurMax;
    const profondeurMoy = this.profondeurMoy;

    if (!this.us?.us_materials) {
      this.us.us_materials = [];
    }
    this.us.us_materials.push({
      table: ApiDbTable.us_construite_materiel,
      author_uuid: this.w.data().user.user_uuid,
      created: 0,
      live: true,
      versions: [],
      projet_uuid: this.us.projet_uuid,
      us_uuid: this.us.us_uuid,
      us_construite_materiel_uuid: v4(),
      nature: nature,
      pourcent: pourcent,
      modules: modules,
      largeur_min: largeurMin,
      largeur_max: largeurMax,
      largeur_moyenne: largeurMoy,
      hauteur_min: hauteurMin,
      hauteur_max: hauteurMax,
      hauteur_moyenne: hauteurMoy,
      profondeur_min: profondeurMin,
      profondeur_max: profondeurMax,
      profondeur_moyenne: profondeurMoy,
    });
    this.clearForm();
    this.onChangeForm();
    this.closeModal();
  }

  calcLargeurMoyenne() {
    if (this.largeurMin && this.largeurMax) {
      this.largeurMoy = (this.largeurMin + this.largeurMax) / 2;
    }
  }

  calcHauteurMoyenne() {
    if (this.hauteurMin && this.hauteurMax) {
      this.hauteurMoy = (this.hauteurMin + this.hauteurMax) / 2;
    }
  }

  calcProfondeurMoyenne() {
    if (this.profondeurMin && this.profondeurMax) {
      this.profondeurMoy = (this.profondeurMin + this.profondeurMax) / 2;
    }
  }

  validMortal() {
    this.updateMortalValue();
    this.closeConstModal();
    this.onChangeForm();
  }

  updateMortalValue() {
    if (this.us?.us_mortal_type_uuid !== UsMortarTypeEnum.MORTIER_DE_CHAUD
      && this.us?.us_mortal_type_uuid !== UsMortarTypeEnum.MORTIER_DE_TUILEAU) {
      this.resetMortalSubData();
    }
    if (this.hardness) {
      this.us.us_mortal_durete = this.hardness;
    }
    if (this.color) {
      this.us.us_mortal_color = this.color;
    }

    this.inclusionsCheckbox.forEach(check => {
      switch (check.checkBoxLabel) {
        case 'Sable':
          this.us.us_mortal_inclusions_sable = check.value;
          break;
        case 'Gravier':
          this.us.us_mortal_inclusions_gravier = check.value;
          break;
        case 'Cailloutis':
          this.us.us_mortal_inclusions_cailloutis = check.value;
          break;
        case 'Nodules d\'argile':
          this.us.us_mortal_inclusions_nodules_argile = check.value;
          break;
        case 'Nodules de chaux':
          this.us.us_mortal_inclusions_nodules_chaux = check.value;
          break;
        case 'TCA':
          this.us.us_mortal_inclusions_tca = check.value;
          break;
        case 'Charbons':
          this.us.us_mortal_inclusions_charbons = check.value;
          break;
        case 'Matière végétale':
          this.us.us_mortal_inclusions_matiere_vegetale = check.value;
          break;
        default:
          LOG.debug.log({...CONTEXT, action: 'updateMortalValue', message: ' WTF ????'});
      }
    });
  }

  deleteMaterial(materialToDelete: ApiUsMaterial) {
    materialToDelete.live = false;
    this.onChangeForm();
  }

  clearMortal() {
    this.us.us_mortal_type_uuid = null;
    this.resetMortalSubData();
    this.onChangeForm();
    LOG.debug.log({...CONTEXT, action: 'clearMortal'}, this.us);
  }

  resetMortalSubData() {
    this.us.us_mortal_durete = null;
    this.us.us_mortal_color = null;
    this.us.us_mortal_inclusions_sable = false;
    this.us.us_mortal_inclusions_gravier = false;
    this.us.us_mortal_inclusions_cailloutis = false;
    this.us.us_mortal_inclusions_nodules_argile = false;
    this.us.us_mortal_inclusions_nodules_chaux = false;
    this.us.us_mortal_inclusions_tca = false;
    this.us.us_mortal_inclusions_charbons = false;
    this.us.us_mortal_inclusions_matiere_vegetale = false;
  }

  clearForm() {
    this.percent = null;
    this.nature = null;
    this.modules = null;
    this.largeurMin = null;
    this.largeurMax = null;
    this.largeurMoy = null;
    this.hauteurMin = null;
    this.hauteurMax = null;
    this.hauteurMoy = null;
    this.profondeurMin = null;
    this.profondeurMax = null;
    this.profondeurMoy = null;
  }

  onChangeForm() {
    if (this.unSaveForm) {
      return;
    } else {
      this.unSaveForm = true;
      this.unSaveFormChange.emit(true);
    }
  }

  isStructureRevetement(): boolean {
    return this.us.us_structure_appareil === "52e09120-3c4f-4692-908c-486c4530d084";
  }
}
