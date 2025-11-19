import {Injectable} from '@angular/core';
import {WorkerService} from "./worker.service";
import {
  ApiContenant,
  ApiDbTable,
  ApiDocumentMinute,
  ApiDocumentPhoto,
  ApiEchantillonMobilier,
  ApiEchantillonPrelevement,
  ApiEnsemble,
  ApiFait,
  ApiSecteur,
  ApiSection,
  ApiStratigraphie,
  ApiSyncableObject,
  ApiTopo,
  ApiUs
} from "../../../shared";
import {LOG, LoggerContext} from "ngx-wcore";
import {dbBoundObject} from "../DataClasses/models/db-bound-object";
import {formatDate} from "@angular/common";
import {CastorUtilitiesService} from "./castor-utilities.service";

/* Enums */
export enum SecteurDownloadableCategories {
  label = 'Label', // tag
  date_creation = 'Creation',
  date_modification = 'Derniere modification',
  type = 'Type',
  largeur = 'Largeur',
  longueur = 'Longueur',
  profondeur = 'Profondeur',
  surface = 'Surface',
  volume = 'Volume',
  z_sup = 'Z_Sup',
  z_inf = 'Z_Inf',
  liste_fait = 'Faits',
  liste_us = 'US',
  liste_ensemble = 'Ensembles',
  liste_sondage = 'Sondages',
  liste_mobiliers = 'Mobiliers',
  liste_prelevement = 'Prelevements',
  remarques = 'Remarques',
}

export enum FaitDownloadableCategories {
  label = 'Label', // tag
  date_creation = 'Creation',
  date_modification = 'Derniere modification',
  loc_secteur = 'Secteur',
  liste_ensemble = 'Ensembles',
  fait_identification = 'Identification',
  fait_description = 'Description',
  list_us = 'Liste des US',
  forme_plan = 'Plan',
  forme_profil = 'Profil',
  dim_longueur = 'Longeur',
  dim_largeur = 'Largeur',
  dim_hauteur = 'Hauteur',
  z_sup = 'Z_Sup',
  z_inf = 'Z_Inf',
  strati_anterieur = 'Antérieur',
  strati_contemporain = 'Contemporain',
  strati_posterieur = 'Postérieur',
  datation_mobilier = 'Datation (Mobilier)',
  datation_strati = 'Datation (Phase)',
  datation_archeometrie = 'Datation (Analyse)',
  fouille_etat = 'Etat de la fouille',
  fouille_technique = 'Méthode de fouille',
  liste_sondage = 'Liste des sondages', // TAG
  liste_mobilier = 'Liste du mobilier', // Liste materiaux
  liste_prelevements = 'Liste des prélèvement', // Liste des natures
  liste_minutes = 'Liste des minutes', // Liste TAG
  liste_photo = 'Liste des photos', // Liste TAG
}

export enum UsDownloadableCategories {
  label = 'Label', // tag
  date_creation = 'Creation',
  date_modification = 'Derniere modification',
  loc_secteur = 'Secteur',
  loc_fait = 'N° de fait',
  liste_ensemble = 'Ensembles',
  us_type = 'Type',
  us_identification = 'Identification',
  us_description = 'Description',
  dim_longueur = 'Longeur',
  dim_largeur = 'Largeur',
  dim_hauteur = 'Hauteur',
  z_sup = 'Z_Sup',
  z_inf = 'Z_Inf',
  strati_anterieur = 'Antérieur',
  strati_contemporain = 'Contemporain',
  strati_posterieur = 'Postérieur',
  datation_mobilier = 'Datation (Mobilier)',
  datation_strati = 'Datation (Phase)',
  datation_archeometrie = 'Datation (Analyse)',
  fouille_etat = 'Etat de la fouille',
  fouille_technique = 'Méthode de fouille',
  liste_sondage = 'Liste des sondages', // TAG
  liste_mobilier = 'Liste du mobilier', // Liste materiaux
  liste_prelevements = 'Liste des prélèvement', // Liste des natures
  liste_minutes = 'Liste des minutes', // Liste TAG
  liste_photo = 'Liste des photos', // Liste TAG
}

export enum EnsembleDownloadableCategories {
  label = 'Label', // tag
  date_creation = 'Creation',
  date_modification = 'Derniere modification',
  ensemble_identification = 'Identification',
  ensemble_description = 'Description',
  dim_longueur = 'Longeur',
  dim_largeur = 'Largeur',
  dim_superficie = 'Superficie',
  ensemble_datation = 'Datation',
  liste_faits = 'Liste des faits',
  liste_us = 'Liste des US',
  liste_minutes = 'Liste des minutes',
  liste_photos = 'Liste des photos'
}

export enum SondagesDownloadableCategories {
  label = 'Label', // tag
  date_creation = 'Creation',
  date_modification = 'Derniere modification',
  loc_secteur = 'Secteur',
  sondage_type = 'Type',
  sondage_description = 'Description',
  dim_longueur = 'Longeur',
  dim_largeur = 'Largeur',
  dim_profondeur = 'Profondeur',
  dim_superficie = 'Superficie',
  dim_volume = 'Volume',
  z_sup = 'Z Sup',
  z_inf = 'Z inf',
  liste_faits = 'Liste des faits',
  liste_us = 'Liste des US',
  liste_mobilier = 'Liste du mobilier', // Material list
  liste_prelevements = 'Liste des prélèvement', // Nature list
  liste_minutes = 'Liste des minutes', // Tag list
  liste_photos = 'Liste des photos' // Tag list
}

export enum MobilierDownloadableCategories {
  label = 'Label', // tag
  date_creation = 'Creation',
  date_modification = 'Derniere modification',
  loc_secteur = 'Secteur',
  loc_fait = 'Fait',
  loc_us = 'US',
  loc_sondage = 'Sondage',
  mobilier_type = 'Type',
  materiau = 'Matériau',
  mobilier_designation = 'Désignation',
  mobilier_identification = 'Identification',
  mobilier_nr = 'NR',
  mobilier_pr = 'PR (g)',
  mobilier_datation = 'Datation',
  mobilier_etat = 'État',
  mobilier_remarque = 'Remarques',
  list_photos = 'Photos',
  list_contenant = 'Contenants'
}

export enum PrelevementDownloadableCategories {
  label = 'Label', // tag
  date_creation = 'Creation',
  date_modification = 'Derniere modification',
  loc_secteur = 'Secteur',
  loc_fait = 'Fait',
  loc_us = 'US',
  loc_sondage = 'Sondage',
  prelevement_nature = 'Nature',
  prelevement_quantitie = 'Quantité',
  prelevement_etat = 'État',
  prelevement_remarques = 'Remarques',
  list_contenants = 'Contenants'
}

export enum ContenantsDownloadableCategories {
  label = 'Label', // tag
  date_creation = 'Creation',
  date_modification = 'Derniere modification',
  contenant_type = 'Type',
  contenant_remarques = 'Remarques',
  liste_materiaux = 'Matériaux des mobiliers',
  liste_mobilier = 'Liste des mobiliers',
  liste_natures = 'Natures des prélèvements',
  liste_prelevements = 'Liste des prélèvements',
  liste_contenants = 'Liste des contenants',
}

export enum MinutesDownloadableCategories {
  label = 'Label', // tag
  date_creation = 'Creation',
  date_modification = 'Derniere modification',
  minute_support = 'Minute support',
  minute_remarques = 'Minute remarques',
  liste_faits = 'Liste des faits', // Tags
  liste_us = 'Liste des US', // Tags
  liste_ensembles = 'Liste des ensembles', // Tags
  liste_sondages = 'Liste des sondages', // Tags
  liste_mobilier = 'Liste du mobilier', // Tags
  liste_prelevements = 'Liste des prélèvement', // Tags
  liste_types = 'Type(s)', // Type dessins
  liste_echelle = 'Échelles' // Liste des Echelles
}

export enum PhotosDownloadableCategories {
  label = 'Label', // tag
  photo_type = 'Type',
  date_creation = 'Creation',
  date_modification = 'Derniere modification',
  liste_faits = 'Liste des faits', // Tags
  liste_us = 'Liste des US', // Tags
  liste_ensembles = 'Liste des ensembles', // Tags
  liste_sondages = 'Liste des sondages', // Tags
  liste_mobilier = 'Liste du mobilier', // Tags
  liste_prelevements = 'Liste des prélèvement', // Tags
  photo_vue_vers = 'Vue',
  photo_etat_fouille = 'État fouille',
  photo_plaque= 'Plaque',
  photo_description = 'Description',
  photo_format= 'Format',
  photo_dimensions = 'Dimensions',
  photo_poids = 'Poids',
  photo_remarques= 'Remarques',
}

export enum ToposDownloadableCategories {
  label = 'Label', // tag
  date_creation = 'Creation',
  date_modification = 'Derniere modification',
  loc_secteur = 'Secteur',
  topo_type = 'Type',
  loc_x = 'x',
  loc_y = 'y',
  loc_z = 'z',
  topo_levee = 'Levée',
  topo_remarques = 'Remarques',
  liste_faits = 'Liste des faits', // Tags
  liste_us = 'Liste des US', // Tags
  liste_ensembles = 'Liste des ensembles', // Tags
  liste_sondages = 'Liste des sondages', // Tags
  liste_mobilier = 'Liste du mobilier', // Tags
  liste_prelevements = 'Liste des prélèvement', // Tags
}

const CONTEXT: LoggerContext = {
  origin: 'CastorListDownloadHelperService'
}

@Injectable({
  providedIn: 'root'
})
export class CastorListDownloadHelperService {

  private categories: Map<ApiDbTable, Array<string>> = new Map<ApiDbTable, Array<string>>();

  constructor(private w: WorkerService, private utils: CastorUtilitiesService) {
    this.generateCatLists();
  }

  private generateCatLists() {
    Object.keys(ApiDbTable).forEach(key => {
      switch (key) {
        case ApiDbTable.contenant:
          this.categories.set(key, Object.entries(ContenantsDownloadableCategories).map(x => x[1]));
          break;
        case ApiDbTable.document_photo:
          this.categories.set(key, Object.entries(PhotosDownloadableCategories).map(x => x[1]));
          break;
        case ApiDbTable.document_minute:
          this.categories.set(key, Object.entries(MinutesDownloadableCategories).map(x => x[1]));
          break;
        case ApiDbTable.echantillon_mobilier:
          this.categories.set(key, Object.entries(MobilierDownloadableCategories).map(x => x[1]));
          break;
        case ApiDbTable.echantillon_prelevement:
          this.categories.set(key, Object.entries(PrelevementDownloadableCategories).map(x => x[1]));
          break;
        case ApiDbTable.ensemble:
          this.categories.set(key, Object.entries(EnsembleDownloadableCategories).map(x => x[1]));
          break;
        case ApiDbTable.fait:
          this.categories.set(key, Object.entries(FaitDownloadableCategories).map(x => x[1]));
          break;
        case ApiDbTable.secteur:
          this.categories.set(key, Object.entries(SecteurDownloadableCategories).map(x => x[1]));
          break;
        case ApiDbTable.section:
          this.categories.set(key, Object.entries(SondagesDownloadableCategories).map(x => x[1]));
          break;
        case ApiDbTable.topo:
          this.categories.set(key, Object.entries(ToposDownloadableCategories).map(x => x[1]));
          break;
        case ApiDbTable.us:
          this.categories.set(key, Object.entries(UsDownloadableCategories).map(x => x[1]));
          break;
        default:
          break;
      }
    });
  }

  getCompiledList(table: ApiDbTable, selectedCategories: Set<string>): Array<Map<string, string>> {
    switch (table) {
      case ApiDbTable.contenant:
        return this.getContenantsList(selectedCategories);
      case ApiDbTable.document_photo:
        return this.getPhotosList(selectedCategories);
      case ApiDbTable.document_minute:
        return this.getMinutesList(selectedCategories);
      case ApiDbTable.echantillon_mobilier:
        return this.getMobilierList(selectedCategories);
      case ApiDbTable.echantillon_prelevement:
        return this.getPrelevementList(selectedCategories);
      case ApiDbTable.ensemble:
        return this.getEnsembleList(selectedCategories);
      case ApiDbTable.fait:
        return this.getFaitList(selectedCategories);
      case ApiDbTable.secteur:
        return this.getSectorList(selectedCategories);
      case ApiDbTable.section:
        return this.getSectionList(selectedCategories);
      case ApiDbTable.topo:
        return this.getTopoList(selectedCategories);
      case ApiDbTable.us:
        return this.getUSList(selectedCategories);
      default:
        LOG.warn.log({...CONTEXT, action: 'getCompiledList', message: 'This table is not configured !'}, table);
        return [];
    }
  }

  getCategories(table: ApiDbTable): Array<string> {
    return this.categories.get(table);
  }

  /* SECTOR */
  private getSectorList(selections: Set<string>): Array<Map<string, string>> {
    LOG.debug.log({...CONTEXT, action: 'getSectorList', message: 'START'}, selections);
    const list: Array<dbBoundObject<ApiSecteur>> = this.w.data().objects.secteur.all.list;
    const new_list: Array<Map<string, string>> = [];
    list.forEach(sector => {
      const new_map: Map<string, string> = new Map<string, string>();
      selections.forEach(category => {
        new_map.set(category, this.getSectorCategory(sector, category as SecteurDownloadableCategories));
      });
      new_list.push(new_map);
    });
    LOG.debug.log({...CONTEXT, action: 'getSectorList', message: 'END'}, new_list);
    return new_list;
  }
  private getSectorCategory(item: dbBoundObject<ApiSecteur>, category: SecteurDownloadableCategories) {

    // FAIT
    const Faits = this.utils.getAllSectorFaits(item.item.secteur_uuid);

    // US
    const US = this.utils.getAllSectorUS(item.item.secteur_uuid);

    // ENSEMBLES
    const Ensembles = this.utils.getAllSectorEnsemble(item.item.secteur_uuid);

    // MOBILIERS PRELEVEMENTS
    const Mobiliers = this.utils.getAllSectorMobiliers(item.item.secteur_uuid);
    const Prelevement = this.utils.getAllSectorPrelevements(item.item.secteur_uuid);

    // SONDAGES
    const Sondages = this.utils.getAllSectorSondages(item.item.secteur_uuid);

    switch (category) {
      case SecteurDownloadableCategories.label:
        return item?.item.tag;
      case SecteurDownloadableCategories.date_modification:
        return formatModificationDate(new Date(item?.item?.created));
      case SecteurDownloadableCategories.type:
        return item?.item.secteur_type ?? '';
      case SecteurDownloadableCategories.largeur:
        return this.utils.dimensionToMeter(item?.item.secteur_dim_largeur)?.toString() ?? '';
      case SecteurDownloadableCategories.longueur:
        return this.utils.dimensionToMeter(item?.item.secteur_dim_longeur)?.toString() ?? '';
      case SecteurDownloadableCategories.profondeur:
        return this.utils.dimensionToMeter(item?.item.secteur_dim_profondeur)?.toString() ?? '';
      case SecteurDownloadableCategories.surface:
        return this.utils.dimensionToMeter(item?.item.secteur_dim_surface, 'surface')?.toString() ?? ''
      case SecteurDownloadableCategories.volume:
        return this.utils.dimensionToMeter(item?.item.secteur_dim_volume, 'volume')?.toString() ?? '';
      case SecteurDownloadableCategories.z_sup:
        return item?.item.secteur_z_sup?.toString() ?? '';
      case SecteurDownloadableCategories.z_inf:
        return item?.item.secteur_z_inf?.toString() ?? '';
      case SecteurDownloadableCategories.liste_fait:
        return Faits?.map(fait => fait?.item.tag).join(',');
      case SecteurDownloadableCategories.liste_us:
        return US?.map(us => us?.item.tag).join(',');
      case SecteurDownloadableCategories.liste_ensemble:
        return Ensembles?.map(item => item?.item.tag).join(',');
      case SecteurDownloadableCategories.liste_sondage:
        return Sondages?.map(item => item?.item.tag).join(',');
      case SecteurDownloadableCategories.liste_mobiliers:
        return Mobiliers?.map(item => item?.item.tag).join(',');
      case SecteurDownloadableCategories.liste_prelevement:
        return Prelevement?.map(item => item?.item.tag).join(',');
      case SecteurDownloadableCategories.remarques:
        return item?.item.secteur_notes ?? '';
      case SecteurDownloadableCategories.date_creation:
        return extractCreationDate(item?.item);
      default:
        LOG.warn.log({...CONTEXT, action: 'getSectorCategory', message: 'unknown category'}, category);
        return '';

    }
  }

  /* FAITS */
  private getFaitList(selections: Set<string>): Array<Map<string, string>> {
    LOG.debug.log({...CONTEXT, action: 'getFaitList', message: 'START'}, selections);
    const list: Array<dbBoundObject<ApiFait>> = this.w.data().objects.fait.all.list;
    const new_list: Array<Map<string, string>> = [];
    list.forEach(fait => {
      const new_map: Map<string, string> = new Map<string, string>();
      selections.forEach(category => {
        new_map.set(category, this.getFaitCategory(fait, category as FaitDownloadableCategories));
      });
      new_list.push(new_map);
    });
    LOG.debug.log({...CONTEXT, action: 'getFaitList', message: 'END'}, new_list);
    return new_list;
  }
  private getFaitCategory(item: dbBoundObject<ApiFait>, category: FaitDownloadableCategories) {

    // Ensemble list
    const Ensembles = this.w.data().links.link_ensemble_fait?.all?.list?.filter(link => link.item.fait_uuid === item.item.fait_uuid)
      .map(link => this.w.data().objects.ensemble.all.list?.find(ensemble => ensemble.item.ensemble_uuid === link.item.ensemble_uuid));
    // US list
    const US = this.w.data().objects.us?.all?.list?.filter(us => us?.item?.fait_uuid === item?.item?.fait_uuid);
    // identification fait label
    const faitID = this.w.data().types.list
      ?.find(type => type?.type_uuid === item?.item?.fait_identification_uuid)?.type_label;
    // Fouille etat label
    const fouilleEtat = this.w.data().types.list?.find(type => type?.type_uuid === item?.item?.fait_stat_uuid)?.type_label;
    // Fait form plan label
    const formPlan = this.w.data().types.list?.find(type => type?.type_uuid === item?.item?.fait_form_plan)?.type_label;
    // Fait form profil label
    const formProfil = this.w.data().types.list?.find(type => type?.type_uuid === item?.item?.fait_form_profile)?.type_label;
    // Section list
    const Sections = this.w.data().links.link_section_fait?.all?.list?.filter(link => link?.item.fait_uuid === item?.item?.fait_uuid)
      .map(link => this.w.data().objects.section?.all?.list?.find(section => section.item?.section_uuid === link.item.section_uuid));
    // Mobilier list
    const Mobiliers = this.w.data().objects.echantillon.all?.childList(ApiDbTable.echantillon_mobilier)
      .filter(mobilier => US.some(us => us.item.us_uuid === mobilier.item.us_uuid)) as Array<dbBoundObject<ApiEchantillonMobilier>>;
    // Prelevement list
    const Prelevement = this.w.data().objects.echantillon.all?.childList(ApiDbTable.echantillon_prelevement)
      .filter(prelevement => US.some(us => us.item.us_uuid === prelevement.item.us_uuid)) as Array<dbBoundObject<ApiEchantillonPrelevement>>;
    // Minutes list
    const Minutes = this.w.data().links.link_document_fait?.all?.list?.filter(link => link?.item.fait_uuid === item?.item?.fait_uuid)
      .map(link => this.w.data().objects.document?.all?.childList(ApiDbTable.document_minute)
        .find(doc => doc?.item?.document_uuid === link?.item.document_uuid)).filter(item => item !== undefined) as Array<dbBoundObject<ApiDocumentMinute>>;
    // Photo list
    const Photos = this.w.data().links.link_document_fait?.all?.list?.filter(link => link?.item?.fait_uuid === item?.item?.fait_uuid)
      .map(link => this.w.data().objects.document?.all?.childList(ApiDbTable.document_photo)
        .find(doc => doc?.item?.document_uuid === link?.item.document_uuid)).filter(item => item !== undefined) as Array<dbBoundObject<ApiDocumentPhoto>>;

    switch (category) {
      case FaitDownloadableCategories.label:
        return item?.item.tag;
      case FaitDownloadableCategories.date_creation:
        return extractCreationDate(item?.item);
      case FaitDownloadableCategories.date_modification:
        return formatModificationDate(new Date(item?.item?.created));
      case FaitDownloadableCategories.loc_secteur:
        return this.w.data().objects.secteur?.all?.list
          ?.find(sector => sector?.item?.secteur_uuid === item?.item.secteur_uuid)?.item?.tag ?? '';
      case FaitDownloadableCategories.liste_ensemble:
        return Ensembles.map(item => item?.item?.tag).join(',');
      case FaitDownloadableCategories.fait_identification:
        return faitID ?? '';
      case FaitDownloadableCategories.fait_description:
        return this.utils.truncate(item?.item?.fait_description, 200, true) ?? '';
      case FaitDownloadableCategories.list_us:
        return US?.map(us => us?.item?.tag).join(',');
      case FaitDownloadableCategories.forme_plan:
        return formPlan ?? '';
      case FaitDownloadableCategories.forme_profil:
        return formProfil ?? '';
      case FaitDownloadableCategories.dim_longueur:
        return this.utils.dimensionToMeter(item?.item?.fait_dim_longueur)?.toString() ?? '';
      case FaitDownloadableCategories.dim_largeur:
        return this.utils.dimensionToMeter(item?.item?.fait_dim_largeur)?.toString() ?? '';
      case FaitDownloadableCategories.dim_hauteur:
        return this.utils.dimensionToMeter(item?.item?.fait_dim_hauteur)?.toString() ?? '';
      case FaitDownloadableCategories.z_sup:
        return item?.item?.fait_z_sup?.toString() ?? '';
      case FaitDownloadableCategories.z_inf:
        return item?.item?.fait_z_inf?.toString() ?? '';
      case FaitDownloadableCategories.strati_anterieur:
        return ''; // TODO: Later
      case FaitDownloadableCategories.strati_contemporain:
        return ''; // TODO: Later
      case FaitDownloadableCategories.strati_posterieur:
        return ''; // TODO: Later
      case FaitDownloadableCategories.datation_mobilier:
        return ''; // TODO: Later
      case FaitDownloadableCategories.datation_strati:
        return ''; // TODO: Later
      case FaitDownloadableCategories.datation_archeometrie:
        return ''; // TODO: Later
      case FaitDownloadableCategories.fouille_etat:
        return fouilleEtat ?? '';
      case FaitDownloadableCategories.fouille_technique:
        const fouilleMeca: string = item?.item?.fait_methode_manual ? 'Manuel ' : '';
        const fouilleManual: string = item?.item?.fait_methode_mechanical ? 'Mécanique' : '';
        return fouilleMeca + fouilleManual;
      case FaitDownloadableCategories.liste_sondage:
        return Sections.map(item => item?.item?.tag).join(',');
      case FaitDownloadableCategories.liste_mobilier:
        // Get type label
        return this.utils.getAllMateriauxMobilier(Mobiliers);
      case FaitDownloadableCategories.liste_prelevements:
        // Get type label
        return this.utils.getAllNaturesPrelevement(Prelevement);
      case FaitDownloadableCategories.liste_minutes:
        return Minutes?.map(item => item?.item?.tag).join(',');
      case FaitDownloadableCategories.liste_photo:
        return Photos?.map(item => item?.item?.tag).join(',');
      default:
        LOG.warn.log({...CONTEXT, action: 'getFaitCategory', message: 'unknown category'}, category);
        return '';
    }
  }

  /* US */
  private getUSList(selections: Set<string>): Array<Map<string, string>> {
    LOG.debug.log({...CONTEXT, action: 'getUSList', message: 'START'}, selections);
    const list: Array<dbBoundObject<ApiUs>> = this.w.data().objects.us.all.list;
    const new_list: Array<Map<string, string>> = [];
    list.forEach(us => {
      const new_map: Map<string, string> = new Map<string, string>();
      selections.forEach(category => {
        new_map.set(category, this.getUsCategory(us, category as UsDownloadableCategories));
      });
      new_list.push(new_map);
    });
    LOG.debug.log({...CONTEXT, action: 'getUSList', message: 'END'}, new_list);
    return new_list;
  }
  private getUsCategory(item: dbBoundObject<ApiUs>, category: UsDownloadableCategories) {

    // US Type
    let usType: string;
    switch (item?.info?.obj_table) {
      case ApiDbTable.us_bati:
        usType = 'Bati';
        break;
      case ApiDbTable.us_construite:
        usType = 'Construite';
        break;
      case ApiDbTable.us_negative:
        usType = 'Negative';
        break;
      case ApiDbTable.us_positive:
        usType = 'Positive';
        break;
      case ApiDbTable.us_squelette:
        usType = 'Squelette';
        break;
      case ApiDbTable.us_technique:
        usType = 'Technique';
        break;
      default:
        LOG.debug.log({...CONTEXT}, 'Get us type error not found');
        break;
    }
    // US Identification label
    const usId = this.w.data().types.list
      ?.find(type => type?.type_uuid === item.item.us_identification_uuid)?.type_label;

    // Ensembles
    const Ensembles = this.w.data().links.link_ensemble_us?.all?.list?.filter(ensemble => ensemble?.item?.us_uuid === item?.item?.us_uuid)
      .map(link => this.w.data().objects.ensemble.all?.list?.find(ensemble => ensemble?.item?.ensemble_uuid === link?.item?.ensemble_uuid));

    // Stratigraphie, datation mobiler, datation strati
    const us_uuid = item?.item?.us_uuid;

    let Anterieur: Array<dbBoundObject<ApiUs>> = [];
    let Contemporain: Array<dbBoundObject<ApiUs>> = [];
    let Posterieur: Array<dbBoundObject<ApiUs>> = [];

    const usStratigraphie: {
      anterieur: Array<ApiStratigraphie>;
      contemporain: Array<ApiStratigraphie>;
      posterieur: Array<ApiStratigraphie>;
    } = this.utils.getStratigraphie(us_uuid);
    /* Get us of stratigraphie */
    Anterieur = usStratigraphie.anterieur.map(starti => this.w.data().objects.us.all?.list?.find(us => us.item.us_uuid === starti.us_anterieur));
    Posterieur = usStratigraphie.posterieur.map(strati => this.w.data().objects.us.all?.list?.find(us => us.item.us_uuid === strati.us_posterieur));
    Contemporain = usStratigraphie.contemporain.map(strati => {
      if (strati.us_anterieur === us_uuid) {
        return this.w.data().objects.us.all?.list?.find(us => us.item.us_uuid === strati.us_posterieur);
      } else {
        return this.w.data().objects.us.all?.list?.find(us => us.item.us_uuid === strati.us_anterieur);
      }
    });

    // US Datation mobilier
    const DatationMobilier = this.w.data().types.list
      ?.find(type => type?.type_uuid === item?.item?.us_strati_datation_mobilier_uuid)?.type_label;
    // US Datation Strati
    const DatationStrati = this.w.data().types.list
      ?.find(type => type?.type_uuid === item?.item?.phase_uuid)?.type_label;

    // US fouille etat
    const usFouilleEtat = this.w.data().types.list?.find(type => type?.type_uuid === item?.item?.us_stat)?.type_label;

    // List Section
    const Sections = this.w.data().links.link_section_us?.all?.list?.filter(link => link.item.us_uuid === item.item.us_uuid)
      .map(link => this.w.data().objects.section.all?.list?.find(section => link.item.section_uuid === section.item.section_uuid));

    // Mobilier list
    const Mobiliers = this.w.data().objects.echantillon.all?.childList(ApiDbTable.echantillon_mobilier)
      .filter(mobilier => mobilier?.item.us_uuid === item?.item?.us_uuid) as Array<dbBoundObject<ApiEchantillonMobilier>>;
    // Prelevement list
    const Prelevement = this.w.data().objects.echantillon.all?.childList(ApiDbTable.echantillon_prelevement)
      .filter(prelevement => prelevement?.item?.us_uuid === item?.item.us_uuid) as Array<dbBoundObject<ApiEchantillonPrelevement>>;
    // Minutes list
    const Minutes = this.w.data().links.link_document_us?.all?.list?.filter(link => link?.item.us_uuid === item?.item?.us_uuid)
      .map(link => this.w.data().objects.document?.all?.childList(ApiDbTable.document_minute)
        .find(doc => doc?.item?.document_uuid === link?.item.document_uuid)) as Array<dbBoundObject<ApiDocumentMinute>>;
    // Photo list
    const Photos = this.w.data().links.link_document_us?.all?.list?.filter(link => link?.item?.us_uuid === item?.item?.us_uuid)
      .map(link => this.w.data().objects.document?.all?.childList(ApiDbTable.document_photo)
        .find(doc => doc?.item?.document_uuid === link?.item.document_uuid)) as Array<dbBoundObject<ApiDocumentPhoto>>;

    switch (category) {
      case UsDownloadableCategories.label:
        return item?.item.tag;
      case UsDownloadableCategories.date_creation:
        return extractCreationDate(item?.item);
      case UsDownloadableCategories.date_modification:
        return formatModificationDate(new Date(item?.item?.created));
      case UsDownloadableCategories.loc_secteur:
        return this.w.data().objects.secteur?.all?.list
          ?.find(sector => sector?.item?.secteur_uuid === item?.item.secteur_uuid)?.item?.tag ?? '';
      case UsDownloadableCategories.loc_fait:
        return this.w.data().objects.fait?.all?.list?.find(fait => fait?.item?.fait_uuid === item?.item?.fait_uuid)?.item?.tag ?? '';
      case UsDownloadableCategories.liste_ensemble:
        return Ensembles.map(item => item?.item?.tag).join(',');
      case UsDownloadableCategories.us_type:
        return usType ?? '';
      case UsDownloadableCategories.us_identification:
        return usId ?? '';
      case UsDownloadableCategories.us_description:
        return this.utils.truncate(item?.item?.us_description, 200, true) ?? '';
      case UsDownloadableCategories.dim_longueur:
        return this.utils.dimensionToMeter(item?.item?.us_dim_longeur)?.toString() ?? '';
      case UsDownloadableCategories.dim_largeur:
        return this.utils.dimensionToMeter(item?.item?.us_dim_largeur)?.toString() ?? '';
      case UsDownloadableCategories.dim_hauteur:
        return this.utils.dimensionToMeter(item?.item?.us_dim_hauteur)?.toString() ?? '';
      case UsDownloadableCategories.z_sup:
        return item?.item?.us_z_sup?.toString() ?? '';
      case UsDownloadableCategories.z_inf:
        return item?.item?.us_z_inf?.toString() ?? '';
      case UsDownloadableCategories.strati_anterieur:
        return Anterieur?.map(item => item?.item?.tag).join(',');
      case UsDownloadableCategories.strati_contemporain:
        return Contemporain?.map(item => item?.item?.tag).join(',');
      case UsDownloadableCategories.strati_posterieur:
        return Posterieur?.map(item => item?.item?.tag).join(',');
      case UsDownloadableCategories.datation_mobilier:
        return DatationMobilier ?? '';
      case UsDownloadableCategories.datation_strati:
        return DatationStrati ?? '';
      case UsDownloadableCategories.datation_archeometrie:
        return item?.item?.us_strati_archeometrie ?? '';
      case UsDownloadableCategories.fouille_etat:
        return usFouilleEtat ?? '';
      case UsDownloadableCategories.fouille_technique:
        const fouilleMeca: string = item?.item?.us_methode_manual ? 'Manuel ' : '';
        const fouilleManual: string = item?.item?.us_methode_mechanical ? 'Mécanique' : '';
        return fouilleMeca + fouilleManual;
      case UsDownloadableCategories.liste_sondage:
        return Sections.map(item => item?.item?.tag).join(',');
      case UsDownloadableCategories.liste_mobilier:
        return this.utils.getAllMateriauxMobilier(Mobiliers);
      case UsDownloadableCategories.liste_prelevements:
        return this.utils.getAllNaturesPrelevement(Prelevement);
      case UsDownloadableCategories.liste_minutes:
        return Minutes?.map(item => item?.item?.tag).join(',');
      case UsDownloadableCategories.liste_photo:
        return Photos?.map(item => item?.item?.tag).join(',');
      default:
        LOG.warn.log({...CONTEXT, action: 'getUSCategory', message: 'unknown category'}, category);
        return '';
    }
  }

  /* ENSEMBLE */
  private getEnsembleList(selections: Set<string>): Array<Map<string, string>> {
    LOG.debug.log({...CONTEXT, action: 'getEnsembleList', message: 'START'}, selections);
    const list: Array<dbBoundObject<ApiEnsemble>> = this.w.data().objects.ensemble.all.list;
    const new_list: Array<Map<string, string>> = [];
    list.forEach(ensemble => {
      const new_map: Map<string, string> = new Map<string, string>();
      selections.forEach(category => {
        new_map.set(category, this.getEnsembleCategory(ensemble, category as EnsembleDownloadableCategories));
      });
      new_list.push(new_map);
    });
    LOG.debug.log({...CONTEXT, action: 'getEnsembleList', message: 'END'}, new_list);
    return new_list;
  }
  private getEnsembleCategory(item: dbBoundObject<ApiEnsemble>, category: EnsembleDownloadableCategories) {
    // Ensemble Identification label
    const ensembleID = this.w.data().types.list
      ?.find(type => type?.type_uuid === item?.item?.ensemble_identification_uuid)?.type_label;

    // Ensemble datation
    const EnsembleDatation = this.w.data().types.list?.find(type => type?.type_uuid === item?.item?.ensemble_datation_uuid)?.type_label;
    // Fait list
    const Faits = this.w.data().links.link_ensemble_fait.all?.list
      ?.filter(link => link?.item?.ensemble_uuid === item?.item?.ensemble_uuid)
      ?.map(link => this.w.data().objects?.fait?.all?.list?.find(fait => link?.item?.fait_uuid === fait?.item?.fait_uuid));
    // US List
    const US = this.w.data().links.link_ensemble_us.all?.list
      ?.filter(link => link?.item?.ensemble_uuid === item?.item?.ensemble_uuid)
      ?.map(link => this.w.data().objects?.us?.all?.list?.find(us => link?.item?.us_uuid === us?.item?.us_uuid));
    // Minutes list
    const Minutes = this.w.data().links.link_ensemble_document?.all?.list?.filter(link => link?.item.ensemble_uuid === item?.item?.ensemble_uuid)
      .map(link => this.w.data().objects.document?.all?.childList(ApiDbTable.document_minute)
        .find(doc => doc?.item?.document_uuid === link?.item.document_uuid)) as Array<dbBoundObject<ApiDocumentMinute>>;
    // Photo list
    const Photos = this.w.data().links.link_ensemble_document?.all?.list?.filter(link => link?.item?.ensemble_uuid === item?.item?.ensemble_uuid)
      .map(link => this.w.data().objects.document?.all?.childList(ApiDbTable.document_photo)
        .find(doc => doc?.item?.document_uuid === link?.item.document_uuid)) as Array<dbBoundObject<ApiDocumentPhoto>>;

    switch (category) {
      case EnsembleDownloadableCategories.label:
        return item?.item.tag;
      case EnsembleDownloadableCategories.date_creation:
        return extractCreationDate(item?.item);
      case EnsembleDownloadableCategories.date_modification:
        return formatModificationDate(new Date(item?.item?.created));
      case EnsembleDownloadableCategories.ensemble_identification:
        return ensembleID ?? '';
      case EnsembleDownloadableCategories.ensemble_description:
        return this.utils.truncate(item?.item?.ensemble_description, 200, true) ?? '';
      case EnsembleDownloadableCategories.dim_longueur:
        return this.utils.dimensionToMeter(item?.item?.ensemble_dim_longeur)?.toString() ?? '';
      case EnsembleDownloadableCategories.dim_largeur:
        return this.utils.dimensionToMeter(item?.item?.ensemble_dim_largeur)?.toString() ?? '';
      case EnsembleDownloadableCategories.dim_superficie:
        return this.utils.dimensionToMeter(item?.item?.ensemble_dim_superficie, 'surface')?.toString() ?? '';
      case EnsembleDownloadableCategories.ensemble_datation:
        return EnsembleDatation ?? '';
      case EnsembleDownloadableCategories.liste_faits:
        return Faits?.map(item => item?.item?.tag)?.join('');
      case EnsembleDownloadableCategories.liste_us:
        return US?.map(item => item?.item?.tag)?.join('');
      case EnsembleDownloadableCategories.liste_minutes:
        return Minutes?.map(item => item?.item?.tag)?.join('');
      case EnsembleDownloadableCategories.liste_photos:
        return Photos?.map(item => item?.item?.tag)?.join('');
      default:
        LOG.warn.log({...CONTEXT, action: 'getEnsembleCategory', message: 'unknown category'}, category);
        return '';
    }
  }

  /* Sondages */
  private getSectionList(selections: Set<string>): Array<Map<string, string>> {
    LOG.debug.log({...CONTEXT, action: 'getSondageList', message: 'START'}, selections);
    const list: Array<dbBoundObject<ApiSection>> = this.w.data().objects.section.all.list;
    const new_list: Array<Map<string, string>> = [];
    list.forEach(section => {
      const new_map: Map<string, string> = new Map<string, string>();
      selections.forEach(category => {
        new_map.set(category, this.getSectionCategory(section, category as SondagesDownloadableCategories));
      });
      new_list.push(new_map);
    });
    LOG.debug.log({...CONTEXT, action: 'getSondageList', message: 'END'}, new_list);
    return new_list;
  }
  private getSectionCategory(item: dbBoundObject<ApiSection>, category: SondagesDownloadableCategories) {

    // Sondage type
    const sectionType = this.w.data().types.list
      ?.find(type => type?.type_uuid === item?.item?.section_type)?.type_label;

    // Fait list
    const Faits = this.w.data().links.link_section_fait.all?.list
      ?.filter(link => link?.item?.section_uuid === item?.item?.section_uuid)
      ?.map(link => this.w.data().objects?.fait?.all?.list?.find(fait => link?.item?.fait_uuid === fait?.item?.fait_uuid));
    // US List
    const US = this.w.data().links.link_section_us.all?.list
      ?.filter(link => link?.item?.section_uuid === item?.item?.section_uuid)
      ?.map(link => this.w.data().objects?.us?.all?.list?.find(us => link?.item?.us_uuid === us?.item?.us_uuid));
    // Mobilier list
    const Mobiliers = this.w.data().objects.echantillon.all.list
      .filter(echantillon => echantillon.item.table === ApiDbTable.echantillon_mobilier && echantillon.item.section_uuid === item.item.section_uuid) as Array<dbBoundObject<ApiEchantillonMobilier>> ;
    // Prelevement list
    const Prelevement = this.w.data().objects.echantillon.all.list
      .filter(echantillon => echantillon.item.table === ApiDbTable.echantillon_prelevement && echantillon.item.section_uuid === item.item.section_uuid) as Array<dbBoundObject<ApiEchantillonPrelevement>> ;
    // Minutes list
    const Minutes = this.w.data().links.link_document_section?.all?.list
      ?.filter(link => link?.item.section_uuid === item?.item?.section_uuid)
      .map(link => this.w.data().objects.document?.all?.childList(ApiDbTable.document_minute)
        .find(doc => doc?.item?.document_uuid === link?.item.document_uuid))?.filter(item => item !== undefined) as Array<dbBoundObject<ApiDocumentMinute>>;
    // Photo list
    const Photos = this.w.data().links.link_document_section?.all?.list?.filter(link => link?.item?.section_uuid === item?.item?.section_uuid)
      .map(link => this.w.data().objects.document?.all?.childList(ApiDbTable.document_photo)
        .find(doc => doc?.item?.document_uuid === link?.item.document_uuid))?.filter(item => item !== undefined) as Array<dbBoundObject<ApiDocumentPhoto>>;

    switch (category) {
      case SondagesDownloadableCategories.label:
        return item?.item?.tag;
      case SondagesDownloadableCategories.date_creation:
        return extractCreationDate(item?.item);
      case SondagesDownloadableCategories.date_modification:
        return formatModificationDate(new Date(item?.item?.created));
      case SondagesDownloadableCategories.loc_secteur:
        return ''; // TODO: Later
      case SondagesDownloadableCategories.sondage_type:
        return sectionType ?? '';
      case SondagesDownloadableCategories.sondage_description:
        return this.utils.truncate(item?.item?.section_notes, 200, true) ?? '';
      case SondagesDownloadableCategories.dim_longueur:
        return this.utils.dimensionToMeter(item?.item?.section_dim_longeur)?.toString() ?? '';
      case SondagesDownloadableCategories.dim_largeur:
        return this.utils.dimensionToMeter(item?.item?.section_dim_largeur)?.toString() ?? '';
      case SondagesDownloadableCategories.dim_profondeur:
        return this.utils.dimensionToMeter(item?.item?.section_dim_profondeur)?.toString() ?? '';
      case SondagesDownloadableCategories.dim_superficie:
        return this.utils.dimensionToMeter(item?.item?.section_dim_superficie, 'surface')?.toString() ?? '';
      case SondagesDownloadableCategories.dim_volume:
        return this.utils.dimensionToMeter(item?.item?.section_dim_volume, 'volume')?.toString() ?? '';
      case SondagesDownloadableCategories.z_sup:
        return item?.item?.section_z_sup?.toString() ?? '';
      case SondagesDownloadableCategories.z_inf:
        return item?.item?.section_z_inf?.toString() ?? '';
      case SondagesDownloadableCategories.liste_faits:
        return Faits?.map(item => item?.item?.tag)?.join(',');
      case SondagesDownloadableCategories.liste_us:
        return US?.map(item => item?.item?.tag)?.join(',');
      case SondagesDownloadableCategories.liste_mobilier:
        return this.utils.getAllMateriauxMobilier(Mobiliers);
      case SondagesDownloadableCategories.liste_prelevements:
        return this.utils.getAllNaturesPrelevement(Prelevement);
      case SondagesDownloadableCategories.liste_minutes:
        return Minutes?.map(item => item?.item?.tag)?.join(',');
      case SondagesDownloadableCategories.liste_photos:
        return Photos?.map(item => item?.item?.tag)?.join(',');
      default:
        LOG.warn.log({...CONTEXT, action: 'getSectionCategory', message: 'unknown category'}, category);
        return '';
    }
  }

  /* Mobilier */
  private getMobilierList(selections: Set<string>): Array<Map<string, string>> {
    LOG.debug.log({...CONTEXT, action: 'getMobilierList', message: 'START'}, selections);
    const list: Array<dbBoundObject<ApiEchantillonMobilier>> = this.w.data().objects.echantillon.all.childList(ApiDbTable.echantillon_mobilier) as Array<dbBoundObject<ApiEchantillonMobilier>>;
    const new_list: Array<Map<string, string>> = [];
    list.forEach(mobilier => {
      const new_map: Map<string, string> = new Map<string, string>();
      selections.forEach(category => {
        new_map.set(category, this.getMobilierCategory(mobilier, category as MobilierDownloadableCategories));
      });
      new_list.push(new_map);
    });
    LOG.debug.log({...CONTEXT, action: 'getMobilierList', message: 'END'}, new_list);
    return new_list;
  }
  private getMobilierCategory(item: dbBoundObject<ApiEchantillonMobilier>, category: MobilierDownloadableCategories) {
    // Secteur of Linked US
    const UsMobilier = this.getUS(item?.item?.us_uuid);
    const UsSecteur = this.getUsSecteur(UsMobilier?.item?.secteur_uuid);
    // Fait of US
    const FAIT = this.w.data().objects.fait.all?.list?.find(fait => fait.item.fait_uuid === UsMobilier?.item?.fait_uuid);
    // Sondage ?

    // Mobilier Type
    const MobilierType = this.w.data().types.list?.find(type => type.type_uuid === item?.item?.mobilier_type_uuid)?.type_label;
    // Mobilier Materiau
    const MobilierMateriau = this.w.data().types.list?.find(type => type.type_uuid === item?.item?.type_materiaux_uuid)?.type_label;
    // Mobilier Identification
    const MobilierID = this.w.data().types.list?.find(type => type?.type_uuid === item?.item?.mobilier_identification_uuid)?.type_label;
    // Mobilier Datation
    const MobilierDatation = this.w.data().types.list?.find(type => type?.type_uuid === item?.item?.mobilier_datation_uuid)?.type_label;
    // Mobilier Etat
    const MobilierEtat = this.w.data().types.list?.find(type => type?.type_uuid === item?.item?.mobilier_etat_uuid)?.type_label;
    // Photo list
    const Photos = this.w.data().links.link_document_echantillon?.all?.list?.filter(link => link?.item?.echantillon_uuid === item?.item?.echantillon_uuid)
      .map(link => this.w.data().objects.document?.all?.childList(ApiDbTable.document_photo)
        .find(doc => doc?.item?.document_uuid === link?.item.document_uuid)).filter(item => item !== undefined) as Array<dbBoundObject<ApiDocumentPhoto>>;
    // Contenants List
    const Contenants = this.w.data().links.link_contenant_echantillon?.all?.list?.filter(link => link?.item?.echantillon_uuid === item?.item?.echantillon_uuid)
      .map(link => this.w.data().objects.contenant?.all?.list?.find(contenant => contenant?.item?.contenant_uuid === link?.item?.contenant_uuid));

    switch (category) {
      case MobilierDownloadableCategories.label:
        return item?.item?.tag;
      case MobilierDownloadableCategories.date_creation:
        return extractCreationDate(item?.item);
      case MobilierDownloadableCategories.date_modification:
        return formatModificationDate(new Date(item?.item?.created));
      case MobilierDownloadableCategories.loc_secteur:
        return UsSecteur?.item?.tag;
      case MobilierDownloadableCategories.loc_fait:
        return FAIT?.item?.tag ?? '';
      case MobilierDownloadableCategories.loc_us:
        return UsMobilier?.item?.tag;
      case MobilierDownloadableCategories.loc_sondage:
        return ''; // TODO : Later
      case MobilierDownloadableCategories.mobilier_type:
        return MobilierType ?? '';
      case MobilierDownloadableCategories.materiau:
        return MobilierMateriau ?? '';
      case MobilierDownloadableCategories.mobilier_designation:
        return item?.item?.mobilier_designation ?? '';
      case MobilierDownloadableCategories.mobilier_identification:
        return MobilierID ?? '';
      case MobilierDownloadableCategories.mobilier_nr:
        return item?.item?.mobilier_nr ?? '';
      case MobilierDownloadableCategories.mobilier_pr:
        return item?.item?.mobilier_pr ?? '';
      case MobilierDownloadableCategories.mobilier_datation:
        return MobilierDatation ?? '';
      case MobilierDownloadableCategories.mobilier_etat:
        return MobilierEtat ?? '';
      case MobilierDownloadableCategories.mobilier_remarque:
        return this.utils.truncate(item?.item?.echantillon_description, 200, true) ?? '';
      case MobilierDownloadableCategories.list_photos:
        return Photos?.map(item => item?.item?.tag)?.join(',');
      case MobilierDownloadableCategories.list_contenant:
        return Contenants?.map(item => item?.item?.tag).join(',');
      default:
        LOG.warn.log({...CONTEXT, action: 'getMobilierCategory', message: 'unknown category'}, category);
        return '';
    }
  }

  /* Prelevement */
  private getPrelevementList(selections: Set<string>): Array<Map<string, string>> {
    LOG.debug.log({...CONTEXT, action: 'getPrelevementList', message: 'START'}, selections);
    const list: Array<dbBoundObject<ApiEchantillonPrelevement>> = this.w.data().objects.echantillon.all
      .childList(ApiDbTable.echantillon_prelevement) as Array<dbBoundObject<ApiEchantillonPrelevement>>;
    const new_list: Array<Map<string, string>> = [];
    list.forEach(prelevement => {
      const new_map: Map<string, string> = new Map<string, string>();
      selections.forEach(category => {
        new_map.set(category, this.getPrelevementCategory(prelevement, category as PrelevementDownloadableCategories));
      });
      new_list.push(new_map);
    });
    LOG.debug.log({...CONTEXT, action: 'getPrelevementList', message: 'END'}, new_list);
    return new_list;
  }
  private getPrelevementCategory(item: dbBoundObject<ApiEchantillonPrelevement>, category: PrelevementDownloadableCategories) {
    // Secteur of Linked US
    const UsPrelevement = this.getUS(item?.item?.us_uuid);
    const UsSecteur = this.getUsSecteur(UsPrelevement?.item?.secteur_uuid);
    // Fait of US
    const Fait = this.w.data().objects.fait.all?.list?.find(fait => fait.item.fait_uuid === UsPrelevement?.item?.fait_uuid);
    // Sondage ?

    // Prelevemnt Nature
    const PrelevementNature = this.w.data().types.list?.find(type => type.type_uuid === item?.item?.type_nature_uuid)?.type_label;
    // Prelevement quantité
    const PrelevementQuantite = this.w.data().types.list?.find(type => type.type_uuid === item?.item?.prelevement_quantite)?.type_label;
    // Prelevement Etat
    const PrelevementEtat = this.w.data().types.list?.find(type => type.type_uuid === item?.item?.prelevement_etat)?.type_label;
    // Contenants List
    const Contenants = this.w.data().links.link_contenant_echantillon?.all?.list?.filter(link => link?.item?.echantillon_uuid === item?.item?.echantillon_uuid)
      .map(link => this.w.data().objects.contenant?.all?.list?.find(contenant => contenant?.item?.contenant_uuid === link?.item?.contenant_uuid));

    switch (category) {
      case PrelevementDownloadableCategories.label:
        return item?.item?.tag;
      case PrelevementDownloadableCategories.date_creation:
        return extractCreationDate(item?.item);
      case PrelevementDownloadableCategories.date_modification:
        return formatModificationDate(new Date(item?.item?.created));
      case PrelevementDownloadableCategories.loc_secteur:
        return UsSecteur?.item?.tag ?? '';
      case PrelevementDownloadableCategories.loc_fait:
        return Fait?.item?.tag ?? '';
      case PrelevementDownloadableCategories.loc_us:
        return UsPrelevement?.item?.tag ?? '';
      case PrelevementDownloadableCategories.loc_sondage:
        return '';
      case PrelevementDownloadableCategories.prelevement_nature:
        return PrelevementNature ?? '';
      case PrelevementDownloadableCategories.prelevement_quantitie:
        return PrelevementQuantite ?? '';
      case PrelevementDownloadableCategories.prelevement_etat:
        return PrelevementEtat ?? '';
      case PrelevementDownloadableCategories.prelevement_remarques:
        return this.utils.truncate(item?.item?.echantillon_description, 200, true) ?? '';
      case PrelevementDownloadableCategories.list_contenants:
        return Contenants?.map(item => item?.item?.tag)?.join(',');
      default:
        LOG.warn.log({...CONTEXT, action: 'getPrelevementCategory', message: 'unknown category'}, category);
        return '';
    }
  }

  /* Contenants */
  private getContenantsList(selections: Set<string>): Array<Map<string, string>> {
    LOG.debug.log({...CONTEXT, action: 'getContenantsList', message: 'START'}, selections);
    const list: Array<dbBoundObject<ApiContenant>> = this.w.data().objects.contenant.all.list;
    const new_list: Array<Map<string, string>> = [];
    list.forEach(contenant => {
      const new_map: Map<string, string> = new Map<string, string>();
      selections.forEach(category => {
        new_map.set(category, this.getContenantCategory(contenant, category as ContenantsDownloadableCategories));
      });
      new_list.push(new_map);
    });
    LOG.debug.log({...CONTEXT, action: 'getContenantList', message: 'END'}, new_list);
    return new_list;
  }
  private getContenantCategory(item: dbBoundObject<ApiContenant>, category: ContenantsDownloadableCategories) {

    // Contenant type
    const ContenantType = this.w.data().types.list?.find(type => type?.type_uuid === item?.item?.type_contenant_uuid)?.type_label;

    // Mobilier list
    const MobiliersContenant = this.w.data().links.link_contenant_echantillon?.all?.list
      ?.filter(link => link?.item.contenant_uuid === item?.item?.contenant_uuid)
      .map(link => this.w.data().objects.echantillon?.all?.childList(ApiDbTable.echantillon_mobilier)
        .find(mobilier => mobilier?.item?.echantillon_uuid === link?.item.echantillon_uuid)).filter(item => item !== undefined) as Array<dbBoundObject<ApiEchantillonMobilier>>;
    // Prelevement list
    const PrelevementsContenant = this.w.data().links.link_contenant_echantillon?.all?.list
      ?.filter(link => link?.item.contenant_uuid === item?.item?.contenant_uuid)
      .map(link => this.w.data().objects.echantillon?.all?.childList(ApiDbTable.echantillon_prelevement)
        .find(prelevement => prelevement?.item?.echantillon_uuid === link?.item.echantillon_uuid)).filter(item => item !== undefined) as Array<dbBoundObject<ApiEchantillonPrelevement>>;
    // List des contenants

    switch (category) {
      case ContenantsDownloadableCategories.label:
       return item?.item?.tag;
      case ContenantsDownloadableCategories.date_creation:
        return extractCreationDate(item?.item);
      case ContenantsDownloadableCategories.date_modification:
        return formatModificationDate(new Date(item?.item?.created));
      case ContenantsDownloadableCategories.contenant_type:
        return ContenantType ?? '';
      case ContenantsDownloadableCategories.contenant_remarques:
        return this.utils.truncate(item?.item?.contenant_remarques, 200, true) ?? '';
      case ContenantsDownloadableCategories.liste_materiaux:
        return this.utils.getAllMateriauxMobilier(MobiliersContenant);
      case ContenantsDownloadableCategories.liste_mobilier:
        return MobiliersContenant?.map(item => item?.item?.tag)?.join(',');
      case ContenantsDownloadableCategories.liste_natures:
        return this.utils.getAllNaturesPrelevement(PrelevementsContenant);
      case ContenantsDownloadableCategories.liste_prelevements:
        return PrelevementsContenant?.map(item => item?.item?.tag)?.join(',');
      case ContenantsDownloadableCategories.liste_contenants:
        return '';
      default:
        LOG.warn.log({...CONTEXT, action: 'getContenantCategory', message: 'unknown category'}, category);
        return '';
    }
  }

  /* Minutes */
  private getMinutesList(selections: Set<string>): Array<Map<string, string>> {
    LOG.debug.log({...CONTEXT, action: 'getMinutesList', message: 'START'}, selections);
    const list: Array<dbBoundObject<ApiDocumentMinute>> = this.w.data().objects.document.all.childList(ApiDbTable.document_minute) as Array<dbBoundObject<ApiDocumentMinute>>;
    const new_list: Array<Map<string, string>> = [];
    list.forEach(minute => {
      const new_map: Map<string, string> = new Map<string, string>();
      selections.forEach(category => {
        new_map.set(category, this.getMinuteCategory(minute, category as MinutesDownloadableCategories));
      });
      new_list.push(new_map);
    });
    LOG.debug.log({...CONTEXT, action: 'getMinutesList', message: 'END'}, new_list);
    return new_list;
  }
  private getMinuteCategory(item: dbBoundObject<ApiDocumentMinute>, category: MinutesDownloadableCategories) {

    // Minute support
    const MinuteSupport = this.w.data().types.list?.find(type => type?.type_uuid === item?.item?.minute_support)?.type_label;
    // List of linked fait
    const FaitsMinute = this.getDocumentLinkedFait(item?.item?.document_uuid);
    // List of linked US
    const USMinute = this.getDocumentLinkedUs(item?.item?.document_uuid);
    // List of linked ensemble
    const EnsemblesMinute = this.getDocumentLinkedEnsemble(item?.item?.document_uuid);
    // List of sondages
    const SectionsMinute = this.getDocumentLinkdedSection(item?.item?.document_uuid);
    // list of mobiliers
    const MobiliersMinute = this.getDocumentLinkedMobilier(item?.item?.document_uuid);
    // List of prelevements
    const PrelevementMinute = this.getDocumentLinkedPrelevement(item?.item?.document_uuid);

    switch (category) {
      case MinutesDownloadableCategories.label:
        return item?.item?.tag;
      case MinutesDownloadableCategories.date_creation:
        return extractCreationDate(item?.item);
      case MinutesDownloadableCategories.date_modification:
        return formatModificationDate(new Date(item?.item?.created));
      case MinutesDownloadableCategories.minute_support:
        return MinuteSupport ?? '';
      case MinutesDownloadableCategories.minute_remarques:
        return this.utils.truncate(item?.item?.document_remarques, 200, true) ?? '';
      case MinutesDownloadableCategories.liste_faits:
        return FaitsMinute?.map(item => item?.item?.tag)?.join(',');
      case MinutesDownloadableCategories.liste_us:
        return USMinute?.map(item => item?.item?.tag)?.join(',');
      case MinutesDownloadableCategories.liste_ensembles:
        return EnsemblesMinute?.map(item => item?.item?.tag)?.join(',');
      case MinutesDownloadableCategories.liste_sondages:
        return SectionsMinute?.map(item => item?.item?.tag)?.join(',');
      case MinutesDownloadableCategories.liste_mobilier:
        return MobiliersMinute?.map(item => item?.item?.tag)?.join(',');
      case MinutesDownloadableCategories.liste_prelevements:
        return PrelevementMinute?.map(item => item?.item?.tag)?.join(',');
      case MinutesDownloadableCategories.liste_types:
        return ''; // TODO : Later
      case MinutesDownloadableCategories.liste_echelle:
        return ''; // TODO : Later

      default:
        LOG.warn.log({...CONTEXT, action: 'getMinutesCategory', message: 'unknown category'}, category);
        return '';
    }
  }

  /* Photos */
  private getPhotosList(selections: Set<string>): Array<Map<string, string>> {
    LOG.debug.log({...CONTEXT, action: 'getPhotosList', message: 'START'}, selections);
    const list: Array<dbBoundObject<ApiDocumentPhoto>> = this.w.data().objects.document.all
      ?.childList(ApiDbTable.document_photo) as Array<dbBoundObject<ApiDocumentPhoto>>;
    const new_list: Array<Map<string, string>> = [];
    list.forEach(photo => {
      const new_map: Map<string, string> = new Map<string, string>();
      selections.forEach(category => {
        new_map.set(category, this.getPhotoCategory(photo, category as PhotosDownloadableCategories));
      });
      new_list.push(new_map);
    });
    LOG.debug.log({...CONTEXT, action: 'getPhotosList', message: 'END'}, new_list);
    return new_list;
  }
  private getPhotoCategory(item: dbBoundObject<ApiDocumentPhoto>, category: PhotosDownloadableCategories) {

    // Photo type
    const PhotoType = this.w.data().types?.list?.find(type => type?.type_uuid === item?.item?.photo_type_uuid)?.type_label;
    // Photo vue vers
    const PhotoVueVers = this.w.data().types?.list?.find(type => type?.type_uuid === item?.item?.photo_vue_vers)?.type_label;

    // List of linked fait
    const FaitsPhoto = this.getDocumentLinkedFait(item?.item?.document_uuid);
    // List of linked US
    const UsPhoto = this.getDocumentLinkedUs(item?.item?.document_uuid);
    // List of linked ensemble
    const EnsemblesPhoto = this.getDocumentLinkedEnsemble(item?.item?.document_uuid);
    // List of sondages
    const SectionsPhoto = this.getDocumentLinkdedSection(item?.item?.document_uuid);
    // list of mobiliers
    const MobiliersPhoto = this.getDocumentLinkedMobilier(item?.item?.document_uuid);
    // List of prelevements
    const PrelevementPhoto = this.getDocumentLinkedPrelevement(item?.item?.document_uuid);

    switch (category) {
      case PhotosDownloadableCategories.label:
        return item?.item?.tag;
      case PhotosDownloadableCategories.photo_type:
        return PhotoType ?? '';
      case PhotosDownloadableCategories.date_creation:
        return extractCreationDate(item?.item);
      case PhotosDownloadableCategories.date_modification:
        return formatModificationDate(new Date(item?.item?.created));
      case PhotosDownloadableCategories.liste_faits:
        return FaitsPhoto?.map(item => item?.item?.tag)?.join(',');
      case PhotosDownloadableCategories.liste_us:
        return UsPhoto?.map(item => item?.item?.tag)?.join(',');
      case PhotosDownloadableCategories.liste_ensembles:
        return EnsemblesPhoto?.map(item => item?.item?.tag)?.join(',');
      case PhotosDownloadableCategories.liste_sondages:
        return SectionsPhoto?.map(item => item?.item?.tag)?.join(',');
      case PhotosDownloadableCategories.liste_mobilier:
        return MobiliersPhoto?.map(item => item?.item?.tag)?.join(',');
      case PhotosDownloadableCategories.liste_prelevements:
        return PrelevementPhoto?.map(item => item?.item?.tag)?.join(',');
      case PhotosDownloadableCategories.photo_vue_vers:
        return PhotoVueVers ?? '';
      case PhotosDownloadableCategories.photo_etat_fouille:
        return item?.item?.photo_etat_fouille ?? '';
      case PhotosDownloadableCategories.photo_plaque:
        return item?.item?.photo_plaque ? 'Oui' : 'Non';
      case PhotosDownloadableCategories.photo_description:
        return ''; // TODO : Later
      case PhotosDownloadableCategories.photo_format:
        return item?.item?.photo_format ?? '';
      case PhotosDownloadableCategories.photo_dimensions:
        return item?.item?.photo_taille ?? '';
      case PhotosDownloadableCategories.photo_poids:
        return item?.item?.photo_poids ?? '';
      case PhotosDownloadableCategories.photo_remarques:
        return this.utils.truncate(item?.item?.document_remarques, 200, true) ?? '';
      default:
        LOG.warn.log({...CONTEXT, action: 'getPhotoCategory', message: 'unknown category'}, category);
        return '';
    }
  }

  /* Topos */
  private getTopoList(selections: Set<string>): Array<Map<string, string>> {
    LOG.debug.log({...CONTEXT, action: 'getToposList', message: 'START'}, selections);
    const list: Array<dbBoundObject<ApiTopo>> = this.w.data().objects.topo.all?.list;
    const new_list: Array<Map<string, string>> = [];
    list.forEach(topo => {
      const new_map: Map<string, string> = new Map<string, string>();
      selections.forEach(category => {
        new_map.set(category, this.getTopoCategory(topo, category as ToposDownloadableCategories));
      });
      new_list.push(new_map);
    });
    LOG.debug.log({...CONTEXT, action: 'getTopoList', message: 'END'}, new_list);
    return new_list;
  }
  private getTopoCategory(item: dbBoundObject<ApiTopo>, category: ToposDownloadableCategories) {
    // Topo Type
    const TopoType = this.w.data().types?.list?.find(type => type?.type_uuid === item?.item?.topo_type_uuid)?.type_label;
    // List Linked Faits of Topo
    const FaitsTopo = this.w.data().links.link_topo_fait?.all?.list
      ?.filter(link => link?.item?.topo_uuid === item?.item?.topo_uuid)
      .map(link => this.w.data().objects.fait?.all.list
        .find(fait => fait?.item?.fait_uuid === link?.item.fait_uuid));
    // List Linked US of Topo
    const UsTopo = this.w.data().links.link_topo_us?.all?.list
      ?.filter(link => link?.item?.topo_uuid === item?.item?.topo_uuid)
      .map(link => this.w.data().objects.us?.all.list
        .find(us => us?.item?.us_uuid === link?.item.us_uuid));
    // List Linked Ensembles of Topo
    const EnsemblesTopo = this.w.data().links.link_topo_ensemble?.all?.list
      ?.filter(link => link?.item?.topo_uuid === item?.item?.topo_uuid)
      .map(link => this.w.data().objects.ensemble?.all.list
        .find(ensemble => ensemble?.item?.ensemble_uuid === link?.item.ensemble_uuid));
    // List Linked Sondages of Topo
    const SondagesTopo = this.w.data().links.link_topo_section?.all?.list
      ?.filter(link => link?.item?.topo_uuid === item?.item?.topo_uuid)
      .map(link => this.w.data().objects.section?.all.list
        .find(section => section?.item?.section_uuid === link?.item.section_uuid));
    // List Linked Mobilier of Topo
    const MobiliersTopo = this.w.data().links.link_topo_echantillon?.all?.list
      ?.filter(link => link?.item?.topo_uuid === item?.item?.topo_uuid)
      .map(link => this.w.data().objects.echantillon?.all.childList(ApiDbTable.echantillon_mobilier)
        .find(mobilier => mobilier?.item?.echantillon_uuid === link?.item.echantillon_uuid)) as Array<dbBoundObject<ApiEchantillonMobilier>>;
    // List Linked Prelevement of Topo
    const PrelevementsTopo = this.w.data().links.link_topo_echantillon?.all?.list
      ?.filter(link => link?.item?.topo_uuid === item?.item?.topo_uuid)
      .map(link => this.w.data().objects.echantillon?.all.childList(ApiDbTable.echantillon_prelevement)
        .find(prelevement => prelevement?.item?.echantillon_uuid === link?.item.echantillon_uuid)) as Array<dbBoundObject<ApiEchantillonPrelevement>>;

    switch (category) {
      case ToposDownloadableCategories.label:
        return item?.item?.tag;
      case ToposDownloadableCategories.date_creation:
        return extractCreationDate(item?.item);
      case ToposDownloadableCategories.date_modification:
        return formatModificationDate(new Date(item?.item?.created));
      case ToposDownloadableCategories.loc_secteur:
        return ''; // TODO : ??
      case ToposDownloadableCategories.topo_type:
        return TopoType ?? '';
      case ToposDownloadableCategories.loc_x:
        return item?.item?.topo_loc_x?.toString() ?? '';
      case ToposDownloadableCategories.loc_y:
        return item?.item?.topo_loc_y?.toString() ?? '';
      case ToposDownloadableCategories.loc_z:
        return item?.item?.topo_loc_z?.toString() ?? '';
      case ToposDownloadableCategories.topo_levee:
        return item?.item?.topo_levee ? 'Oui' : 'Non';
      case ToposDownloadableCategories.topo_remarques:
        return this.utils.truncate(item?.item?.topo_remarques, 200, true) ?? '';
      case ToposDownloadableCategories.liste_faits:
        return FaitsTopo?.map(item => item?.item?.tag)?.join(',');
      case ToposDownloadableCategories.liste_us:
        return UsTopo?.map(item => item?.item?.tag)?.join(',');
      case ToposDownloadableCategories.liste_ensembles:
        return EnsemblesTopo.map(item => item?.item?.tag)?.join(',');
      case ToposDownloadableCategories.liste_sondages:
        return SondagesTopo?.map(item => item?.item?.tag)?.join(',');
      case ToposDownloadableCategories.liste_mobilier:
        return MobiliersTopo?.map(item => item?.item?.tag)?.join(',');
      case ToposDownloadableCategories.liste_prelevements:
        return PrelevementsTopo?.map(item => item?.item?.tag)?.join(',');
      default:
        LOG.warn.log({...CONTEXT, action: 'getTopoCategory', message: 'unknown category'}, category);
        return '';
    }
  }

  /* Echantillon Utils Functions */
  private getUS(us_uuid: string): dbBoundObject<ApiUs> {
    return this.w.data().objects.us.all?.list?.find(us => us.item.us_uuid === us_uuid);
  }
  private getUsSecteur(secteur_uuid: string): dbBoundObject<ApiSecteur> {
    return this.w.data().objects.secteur.all?.list?.find(sector => sector.item?.secteur_uuid === secteur_uuid);
  }

  /* Document Utils Fonctions */
  private getDocumentLinkedFait(document_uuid: string): Array<dbBoundObject<ApiFait>> {
    return this.w.data().links.link_document_fait?.all?.list
      ?.filter(link => link?.item?.document_uuid === document_uuid)
      .map(link => this.w.data().objects.fait?.all.list
        .find(fait => fait?.item?.fait_uuid === link?.item.fait_uuid));
  }
  private getDocumentLinkedUs(document_uuid: string): Array<dbBoundObject<ApiUs>> {
    return this.w.data().links.link_document_us?.all?.list
      ?.filter(link => link?.item?.document_uuid === document_uuid)
      .map(link => this.w.data().objects.us?.all.list
        .find(us => us?.item?.us_uuid === link?.item.us_uuid));
  }
  private getDocumentLinkedEnsemble(document_uuid): Array<dbBoundObject<ApiEnsemble>> {
    return this.w.data().links.link_ensemble_document?.all?.list
      ?.filter(link => link?.item?.document_uuid === document_uuid)
      .map(link => this.w.data().objects.ensemble?.all.list
        .find(ensemble => ensemble?.item?.ensemble_uuid === link?.item.ensemble_uuid));
  }
  private getDocumentLinkdedSection(document_uuid): Array<dbBoundObject<ApiSection>> {
    return this.w.data().links.link_document_section?.all?.list
      ?.filter(link => link?.item?.document_uuid === document_uuid)
      .map(link => this.w.data().objects.section?.all.list
        .find(section => section?.item?.section_uuid === link?.item.section_uuid));
  }
  private getDocumentLinkedMobilier(document_uuid: string): Array<dbBoundObject<ApiEchantillonMobilier>> {
    return this.w.data().links.link_document_echantillon?.all?.list
      ?.filter(link => link?.item?.document_uuid === document_uuid)
      .map(link => this.w.data().objects.echantillon?.all.childList(ApiDbTable.echantillon_mobilier)
        .find(mobilier => mobilier?.item?.echantillon_uuid === link?.item.echantillon_uuid)).filter(item => item !== undefined) as Array<dbBoundObject<ApiEchantillonMobilier>>;
  }
  private getDocumentLinkedPrelevement(document_uuid: string): Array<dbBoundObject<ApiEchantillonPrelevement>> {
    return this.w.data().links.link_document_echantillon?.all?.list
      ?.filter(link => link?.item?.document_uuid === document_uuid)
      .map(link => this.w.data().objects.echantillon?.all.childList(ApiDbTable.echantillon_prelevement)
        .find(prelevement => prelevement?.item?.echantillon_uuid === link?.item.echantillon_uuid)).filter(item => item !== undefined) as Array<dbBoundObject<ApiEchantillonPrelevement>>;
  }
}

/* Utils Function */
function extractCreationDate(obj: ApiSyncableObject): string {
  const extractDate = obj.versions?.length ? new Date(obj.versions.reduce(
    (previousValue, currentValue, currentIndex, array) => {
      if (!previousValue) {
        return currentValue;
      } else {
        if (currentValue.created < previousValue.created) {
          return currentValue;
        } else {
          return previousValue;
        }
      }
    }).created) : obj?.created;
  if (extractDate) {
    return formatDate(extractDate, "dd MMM YYYY HH:mm", 'fr-FR');
  } else {
    return '';
  }
}

function formatModificationDate(date: Date): string {
  if (date) {
    return formatDate(date, "dd MMM YYYY HH:mm", 'fr-FR');
  } else {
    return '';
  }
}

