import {ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {
  ApiDbTable,
  ApiFait,
  ApiTypeCategory,
  ApiUs,
  ApiUsBati,
  ApiUsConstruite,
  ApiUsNegative,
  ApiUsPositive
} from "../../../../../shared";
import {WorkerService} from "../../../services/worker.service";
import {map} from "rxjs/operators";
import {Location} from "@angular/common";
import {UsTypeEnum} from "../../../../../shared/objects/models/enums/UsTypeEnum";
import {of} from "rxjs";
import {ConfirmationService} from "../../../services/confirmation.service";
import {dbBoundObject} from "../../../DataClasses/models/db-bound-object";
import {SelectionHook} from "../../../DataClasses/models/castor-abstract-object-data-class";
import {v4} from "uuid";
import {SyncedStorage} from "../../../util/storage-utilities";
import {castorStandardTypeToLabel} from "../../../../../shared/objects/models/StandardTypes";

@Component({
  selector: 'app-us-form',
  templateUrl: './us-form.component.html',
  styleUrls: ['./us-form.component.scss']
})
export class UsFormComponent implements OnInit, OnChanges, OnDestroy {

  private trackBy: (item: ApiUs) => string = (item) => item.us_uuid;
  private _storedItem: SyncedStorage<ApiUs> = SyncedStorage.init(this.trackBy );

  @Input() set us(us: ApiUs) {
    const storage = SyncedStorage.negociate(us, this._storedItem, this.trackBy);
    this._storedItem = storage;
    const currentUs = this._storedItem?.value ?? us;
    if (currentUs) {
      this.ensureUsDefaults(currentUs);
    }
    if (this.cdr) {
      this.cdr.markForCheck();
    }
  };
  get us(): ApiUs {
    return this._storedItem?.value;
  }

  @Input() unSavedForm: boolean;

  readonly hook: SelectionHook<ApiUs> = {
    id: v4(),
    callback: change => {
      return this.validUs().pipe(
        map(result => change)
      );
    }
  };

  public faitOfUs: dbBoundObject<ApiFait>;

  stratigraphieFormValid: boolean;

  usTypeSelected: UsTypeEnum;

  get usPositive(): ApiUsPositive {
    return this.us as ApiUsPositive;
  }

  get usNegative(): ApiUsNegative {
    return this.us as ApiUsNegative;
  }

  get usBati(): ApiUsBati {
    return this.us as ApiUsBati;
  }

  get usConstruite(): ApiUsConstruite {
    return this.us as ApiUsConstruite;
  }

  ApiDbTable = ApiDbTable;
  ApiTypeCategory = ApiTypeCategory;

  constructor(public w: WorkerService, private location: Location,
              private confirmation: ConfirmationService,
              private readonly cdr: ChangeDetectorRef) {
  }

  generalityNotValid(): boolean {
    return !(this.us?.us_methode_mechanical || this.us?.us_methode_manual);
  }

  mesureNotValid(): boolean {
    return !(this.us?.us_z_sup && this.us?.us_z_inf);
  }

  ngOnInit(): void {
    this.getUsType();
    if (this.us?.fait_uuid) {
      this.faitOfUs = this.w.data().objects.fait.all.findByUuid(this.us.fait_uuid);
    }
    this.w.data().objects.us.addHook(this.hook);

  }

  ngOnDestroy() {
    this.w.data().objects.us.removeHook(this.hook);
    this.validUs().subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.us) {
      this.getUsType();
      this.cdr.markForCheck();
    }
  }

  onChangeForm(faitChanged: boolean = false) {
    if (this.unSavedForm) {
      return;
    } else {
      this.unSavedForm = true;
    }
  }

  clearDescription() {
    this.confirmation.showConfirmDialog('Attention !',
      'Effacer la description ?',
      () => {
        this.us.us_description = '';
      }, () => {
      return;
      });
  }

  getUsType() {
    switch (this.us.table) {
      case ApiDbTable.us_negative:
        this.usTypeSelected = UsTypeEnum.NEGATIVE;
        break;
      case ApiDbTable.us_positive:
        this.usTypeSelected = UsTypeEnum.POSITIVE;
        break;
      case ApiDbTable.us_construite:
        this.usTypeSelected = UsTypeEnum.CONSTRUITE;
        break;
      case ApiDbTable.us_technique:
        this.usTypeSelected = UsTypeEnum.TECHNIQUE;
        break;
    }
  }

  onTypeUsChange() {
    // Modify us table
    let usTable: ApiDbTable;
    switch (this.usTypeSelected) {
      case UsTypeEnum.NEGATIVE:
        usTable = ApiDbTable.us_negative;
        break;
      case UsTypeEnum.POSITIVE:
        usTable = ApiDbTable.us_positive;
        break;
      case UsTypeEnum.CONSTRUITE:
        usTable = ApiDbTable.us_construite;
        break;
      case UsTypeEnum.TECHNIQUE:
        usTable = ApiDbTable.us_technique;
        break;
      default:
        usTable = null
        break;
    }
    this.us.table = usTable;
    this.onChangeForm();
  }

  // Get linked FAIT measurement for US
  getFaitLength() {
    this.us.us_dim_longeur = this.faitOfUs.item.fait_dim_longueur;
    this.us.us_dim_reel_longeur = this.faitOfUs.item.fait_dim_reel_long;
    this.onChangeForm();
  }

  getFaitWidth() {
    this.us.us_dim_largeur = this.faitOfUs.item.fait_dim_largeur;
    this.us.us_dim_reel_largeur = this.faitOfUs.item.fait_dim_reel_larg;
    this.onChangeForm();
  }

  getFaitHeight() {
    this.us.us_dim_hauteur = this.faitOfUs.item.fait_dim_hauteur;
    this.us.us_dim_reel_hauteur = this.faitOfUs.item.fait_dim_reel_hauteur;
    this.onChangeForm();
  }

  getFaitZBorn() {
    this.us.us_z_borne = this.faitOfUs.item?.fait_z_borne;
    this.onChangeForm();
  }

  getFaitZLecture() {
    this.us.us_z_lecture = this.faitOfUs.item?.fait_z_lecture;
    this.onChangeForm();
  }

  getFaitZLunette() {
    this.us.us_z_calcul_lunette = this.faitOfUs.item?.fait_z_lunette;
    this.onChangeForm();
  }

  private ensureUsDefaults(us: ApiUs): void {
    if (typeof us.us_identification_uuid === 'undefined') {
      us.us_identification_uuid = null;
    }
    if (typeof us.us_stat === 'undefined') {
      us.us_stat = null;
    }
    if (typeof us.us_precision === 'undefined') {
      us.us_precision = null;
    }
    if (typeof us.us_description === 'undefined') {
      us.us_description = '';
    }
    if (typeof us.us_methode_manual === 'undefined') {
      us.us_methode_manual = false;
    }
    if (typeof us.us_methode_mechanical === 'undefined') {
      us.us_methode_mechanical = false;
    }
    if (typeof us.secteur_uuid === 'undefined') {
      us.secteur_uuid = null;
    }
  }

  getFaitZSupp() {
    this.us.us_z_sup = this.faitOfUs.item?.fait_z_sup;
    this.onChangeForm();
  }

  getFaitZInf() {
    this.us.us_z_inf = this.faitOfUs.item?.fait_z_inf;
    this.onChangeForm();
  }

  getFaitAbsZSupp() {
    this.us.us_alt_absolute_z_supp = this.faitOfUs.item?.fait_absolute_z_sup;
    this.onChangeForm();
  }

  getFaitAbsZInf() {
    this.us.us_alt_absolute_z_inf = this.faitOfUs.item?.fait_absolute_z_inf;
    this.onChangeForm();
  }
  // END of getting fait measurement
  /*----------------------------------*/
  // Calc US height, zSup, zInf
  calcUsHeight() {
    // zSup and zInf is meter
    const zSupNgf = this.us.us_alt_absolute_z_supp;
    const zInfNgf = this.us.us_alt_absolute_z_inf;
    this.us.us_dim_hauteur = Math.round(((zSupNgf - zInfNgf) * 1000) * 100) / 100;
  }

  calcUsZSup() {
    // zSup and zInf is meter
    const zInfNgf = this.us.us_alt_absolute_z_inf;
    const hauteur = this.us.us_dim_hauteur / 1000;
    this.us.us_alt_absolute_z_supp = Math.round((zInfNgf + hauteur) * 100) /100;
  }

  calcUsZInf() {
    /// zSup and zInf is meter
    const zSupNgf = this.us.us_alt_absolute_z_supp;
    const hauteur = this.us.us_dim_hauteur / 1000;
    this.us.us_alt_absolute_z_inf = Math.round((zSupNgf - hauteur) * 100) / 100;
  }

  isHeightCalculated(): boolean {
    return this.us.us_dim_hauteur == Math.round(((this.us.us_alt_absolute_z_supp - this.us.us_alt_absolute_z_inf) * 1000) * 100) / 100;
  }

  displayGenerateDescriptionButton(): boolean {
    return [ApiDbTable.us_positive, ApiDbTable.us_negative].includes(this.us.table);
  }

  generateUsDescription() {
    switch (this.us.table) {
      case ApiDbTable.us_positive:
        this.generatePositiveDescription();
        break;
      case ApiDbTable.us_negative:
        this.generateUsNegativeDescription();
        break;
    }
  }

  getTypeLabel(typeUuid: string): string {
    return this.w.data().types.byUuid(typeUuid).type_label;
  }

  isEmpty = (val: string | undefined | null) => !val || val.trim() === "";

  generatePositiveDescription() {

    const p = this.usPositive;

    const getLabel = (val: any) => !this.isEmpty(val) ? this.getTypeLabel(val) : "";

    const descriptionParts: string[] = [];

    const nature1 = getLabel(p.positive_nature1);
    if (nature1) {
      let description = nature1.charAt(0).toUpperCase() + nature1.slice(1);

      const nature2 = getLabel(p.positive_nature2);
      if (nature2) {
        description += ` mêlé de ${nature2} `;
      }

      description += `${getLabel(p.positive_couleur)}, ${getLabel(p.positive_durete)} et ${getLabel(p.positive_homogeneite)}`;

      const inclusions = [
        { type: p.positive_inclusions_type_1, freq: p.positive_inclusions_granularite_1, prefix: "avec de" },
        { type: p.positive_inclusions_type_2, freq: p.positive_inclusions_granularite_2, prefix: ", ainsi que de" },
        { type: p.positive_inclusions_type_3, freq: p.positive_inclusions_granularite_3, prefix: ", mais aussi de" }
      ];

      inclusions.forEach(inclusion => {
        if (!this.isEmpty(inclusion.type)) {
          description += `${inclusion.prefix} ${getLabel(inclusion.freq)} inclusions de ${getLabel(inclusion.type)}`;
        }
      });

      description += `. Charbons ${getLabel(p.positive_charbons)}`;

      const perturbations = [
        { perturbation: p.positive_perturbations_1, prefix: ". Présence de" },
        { perturbation: p.positive_perturbations_2, prefix: ", ainsi que de" },
        { perturbation: p.positive_perturbations_3, prefix: ", mais aussi de" }
      ];

      perturbations.forEach(pert => {
        if (!this.isEmpty(pert.perturbation)) {
          description += `${pert.prefix} ${getLabel(pert.perturbation)}`;
        }
      });

      description += ".";

      descriptionParts.push(description);
    }

    if (descriptionParts.length > 0) {
      this.us.us_description = this.us.us_description
        ? `${this.us.us_description}\n${descriptionParts.join(" ")}`
        : descriptionParts.join(" ");
    }
  }

  generateUsNegativeDescription(): void {

    const { negative_plan, negative_profil, us_dim_longeur, us_dim_largeur, us_dim_hauteur } = this.usNegative;

    const formatValue = (val: any) => val?.toString().trim();

    const plan = !this.isEmpty(negative_plan) ? this.getTypeLabel(negative_plan) : "";
    const profil = !this.isEmpty(negative_profil) ? this.getTypeLabel(negative_profil) : "";

    const descriptionParts = [];

    if (plan && profil) {
      descriptionParts.push(`Creusement ${plan}, profil ${profil}`);
    } else if (plan) {
      descriptionParts.push(`Creusement ${plan}`);
    } else if (profil) {
      descriptionParts.push(`Profil ${profil}`);
    }

    const longueur = formatValue(us_dim_longeur);
    const largeur = formatValue(us_dim_largeur);
    const hauteur = formatValue(us_dim_hauteur);

    if (longueur && largeur && hauteur) {
      descriptionParts.push(`(L : ${longueur} ; l. : ${largeur} ; h. : ${hauteur})`);
    }

    const description = descriptionParts.join(" ") + ".";

    if (description.trim() !== ".") {
      this.us.us_description = this.us.us_description
        ? `${this.us.us_description}\n${description}`
        : description;
    }
  }

  validUs(us: ApiUsPositive | ApiUsConstruite | ApiUsNegative | ApiUsBati | ApiUs = this.us) {
    console.log('valid update us ', us);
    if (this.unSavedForm) {
      this.unSavedForm = false;

      us.fait_uuid = this.faitOfUs?.uuid;
      return this.w.data().objects.us.selected.commit(us);
    } else {
      return of(undefined);
    }

  }


}
