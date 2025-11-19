import {ApiProjetRoleEnum, ApiRoleEnum} from "./enums/ApiRole";
import {ApiError} from "wcore-shared";

export interface ApiContenant extends ApiSyncableObject {
    contenant_uuid: string;
    tag: string;
    tag_custom?: string;
    tag_hash: string;
    contenant_label?: string;
    contenant_remarques?: string;
    contenant_created?: number;
    contenant_note?: string;
    // -> si le contenant est dans un autre contenant
    contenant_superieur_uuid?: string;
    // état des contenues -> voir links -> générer à la volé inutile de stoquer
    contenant_stat?: string;
    // localisation des contenues -> voir links -> générer à la volé inutile de stoquer
    contenant_position?: string;
    contenant_total_weight?: number;
    type_contenant_uuid?: string;
    projet_uuid: string;
}

export interface ApiDocument extends ApiSyncableObject {
    document_uuid: string;
    tag: string;
    tag_custom?: string;
    tag_hash: string;
    // uuid du fichier stoquer sur S3
    document_file_uuid: string;
    document_type?: string;
    document_name?: string;
    projet_uuid: string;
    document_remarques?: string;
}

export interface ApiDocumentMinute extends ApiDocument {
    document_minute_uuid: string;
    minute_label?: string;
    minute_support?: string;
    secteur_uuid: string;
    // vectorisée vs non-véctorisé(défaut)
    minute_state_uuid?: string;
    minute_echelle?: string;
    minute_note?: string;
}

export interface ApiDocumentPhoto extends ApiDocument {
    document_photo_uuid: string;
    photo_label?: string;
    photo_url?: string;
    photo_etat_fouille?: string;
    photo_format?: string;
    photo_plaque?: boolean;
    secteur_uuid: string;
    // Depuis cet appareil vs depuis un autre appareil
    photo_state_uuid?: string;
    photo_poids?: string;
    photo_notes?: string;
    photo_type_uuid?: string;
    photo_taille?: string;
    photo_vue_vers?: string;
}

export interface ApiEchantillon extends ApiSyncableObject {
    echantillon_uuid: string;
    tag: string;
    tag_custom?: string;
    tag_hash: string;
    echantillon_label?: string;
    echantillon_description?: string;
    us_uuid: string;
    section_uuid?: string;
}

export interface ApiEchantillonMobilier extends ApiEchantillon {
    echantillon_mobilier_uuid: string;
    mobilier_info?: string;
    mobilier_datation_uuid?: string; // ApiTypeCategory.MOBILIER_DATATION
    mobilier_designation?: string;
    mobilier_etat_uuid?: string; // MOBILIER_ETAT Valeurs : Non lavé / Lavé / Stabilisé / Non prélevé / Non conservé / Déclassé (valeur par défaut : non lavé)
    mobilier_identification_uuid?: string; // MOBILIER_IDENTIFICATION
    mobilier_nr?: string;
    mobilier_pr?: string;
    mobilier_type_uuid?: string; // MOBILIER_TYPE
    mobilier_position?: string;
    mobilier_caisse_number?: number;
    mobilier_precision?: string;
    type_materiaux_uuid?: string; // MOBILIER_MATERIAUX
}

export interface ApiEchantillonPrelevement extends ApiEchantillon {
    echantillon_prelevement_uuid: string;
    prelevement_info?: string;
    prelevement_type_uuid?: string;
    prelevement_position_uuid?: string;
    // Valeurs : Non traité / Traité / Non conservé // Valeur par défaut : Non traité
    prelevement_etat?: string;
    prelevement_quantite?: string;
    type_nature_uuid?: string;
    prelevement_analyse?: string;
}

export interface ApiEnsemble extends ApiSyncableObject {
    ensemble_uuid: string;
    tag: string;
    tag_custom?: string;
    tag_hash: string;
    ensemble_label?: string;
    ensemble_description?: string;
    ensemble_precisions?: string;
    ensemble_dim_largeur?: number;
    // Observée / Réelle
    ensemble_dim_reel_largeur?: boolean;
    ensemble_dim_longeur?: number;
    // Observée / Réelle
    ensemble_dim_reel_longeur?: boolean;
    ensemble_dim_superficie?: number;
    ensemble_datation_uuid?: string;
    // ENSEMBLE_IDENTIFICATION
    ensemble_identification_uuid?: string;
    /// ATTENTION UNIQUEMENT SI TAGSYSTEM SECTEUR
    secteur_uuid?: string;
}

export interface ApiFait extends ApiSyncableObject {
    fait_uuid: string;
    tag: string;
    tag_custom?: string;
    tag_hash: string;
    fait_label?: string;
    // FAIT_IDENTIFICATION
    fait_identification_uuid?: string;
    fait_precision?: string;
    fait_datation_archeometrie?: string;
    fait_dim_hauteur?: number;
    fait_dim_largeur?: number;
    fait_dim_longueur?: number;
    fait_dim_diameter?: number;
    fait_dim_reel_long?: boolean;
    fait_dim_reel_larg?: boolean;
    fait_dim_reel_hauteur?: boolean;
    fait_dim_reel_diameter?: boolean;
    fait_z_axe?: number;
    fait_z_sup?: number;
    fait_z_inf?: number;
    fait_absolute_z_axe?: number;
    fait_absolute_z_sup?: number;
    fait_absolute_z_inf?: number;
    fait_z_borne?: number;
    fait_z_lecture?: number;
    fait_z_lunette?: number;
    fait_z_tolerance?: number;
    fait_methode_manual?: boolean;
    fait_methode_mechanical?: boolean;
    fait_calage_poteau?: boolean;
    fait_description?: string;
    fait_form_plan?: string;
    fait_form_profile?: string;
    secteur_uuid: string;
    fait_validation?: boolean;
    // par défaut : 1
    fait_amount: number;
    // Annulé / non fouillé / Photographié / Sondages / 50% / 100%
    fait_stat_uuid: string;
}

export interface ApiGps extends ApiSyncableObject {
    gps_uuid: number;
    gps_address?: string;
    gps_street_number?: number;
    gps_route?: string;
    gps_locality?: string;
    gps_adminstrative_area_level_1?: string;
    gps_adminstrative_area_level_2?: string;
    gps_country?: string;
    gps_code_postal?: string;
    gps_formated_address?: string;
    gps_lat: string;
    gps_long: string;
    gps_geog: string;
}

export interface ApiLinkContenantEchantillon extends ApiSyncableObject {
    contenant_uuid: string;
    echantillon_uuid: string;
    numero: number;
    quantity: number;
    note?: string;
}

export interface ApiLinkDocumentEchantillon extends ApiSyncableObject {
    document_uuid: string;
    echantillon_uuid: string;
    type_releve?: string;
    note?: string;
}

export interface ApiLinkDocumentFait extends ApiSyncableObject {
    document_uuid: string;
    fait_uuid: string;
    note?: string;
    type_releve?: string;
    echelle_releve?: string;
}

export interface ApiLinkDocumentSection extends ApiSyncableObject {
    document_uuid: string;
    section_uuid: string;
    note?: string;
    type_eleve?: string;
    echelle_eleve?: string;
}

export interface ApiLinkDocumentUs extends ApiSyncableObject {
    document_uuid: string;
    us_uuid: string;
    note?: string;
    type_releve?: string;
    echelle_releve?: string;
}

export interface ApiLinkDocumentEnsemble extends ApiSyncableObject {
    document_uuid: string;
    ensemble_uuid: string;
    note?: string;
    type_releve?: string;
    echelle_releve?: string;
}

export interface ApiLinkEnsembleFait extends ApiSyncableObject {
    ensemble_uuid: string;
    fait_uuid: string;
    note?: string;
}

export interface ApiLinkEnsembleUs extends ApiSyncableObject {
    ensemble_uuid: string;
    us_uuid: string;
    note?: string;
}

export interface ApiLinkSecteurGps extends ApiSyncableObject {
    secteur_uuid: string;
    gps_uuid: number;
    note?: string;
}

export interface ApiLinkSectionEnsemble extends ApiSyncableObject {
    section_uuid: string;
    ensemble_uuid: string;
    note?: string;
}

export interface ApiLinkSectionFait extends ApiSyncableObject {
    section_uuid: string;
    fait_uuid: string;
    note?: string;
    profile?: string;
    largeur?: number;
    hauteur?: number;
    z_supp?: number;
    z_inf?: number;
}

export interface ApiLinkSectionUs extends ApiSyncableObject {
    section_uuid: string;
    us_uuid: string;
    note?: string;
}

export interface ApiLinkDocumentTopo extends ApiSyncableObject {
    topo_uuid: string;
    document_uuid: string;
    note: string;
}

export interface ApiLinkTopoEchantillon extends ApiSyncableObject {
    topo_uuid: string;
    echantillon_uuid: string;
    note?: string;
}

export interface ApiLinkTopoEnsemble extends ApiSyncableObject {
    topo_uuid: string;
    ensemble_uuid: string;
    note?: string;
}

export interface ApiLinkTopoFait extends ApiSyncableObject {
    topo_uuid: string;
    fait_uuid: string;
    note?: string;
}

export interface ApiLinkTopoSection extends ApiSyncableObject {
    topo_uuid: string;
    section_uuid: string;
    note?: string;
}

export interface ApiLinkTopoUs extends ApiSyncableObject {
    topo_uuid: string;
    us_uuid: string;
    note?: string;
}

export interface ApiMouvement extends ApiSyncableObject {
    mouvement_uuid: string;
    tag: string;
    tag_custom?: string;
    tag_hash: string;
    movement_description?: string;
    movement_created?: number;
    mouvement_date_updated?: number;
    mouvement_origin?: number;
    mouvement_destination?: number;
    mouvement_motif?: string;
    mouvement_note?: string;
    mouvement_transporteur?: string;
    gps_uuid: number;
    contenant_uuid: string;
    gps_uuid_localisation_destination: number;
}

export interface ApiPhase extends ApiSyncableObject {
    phase_uuid: string;
    tag: string;
    tag_custom?: string;
    tag_hash: string;
    phase_label?: string;
    phase_description?: string;
    phase_datation?: string;
}

export interface ApiProjet extends ApiSyncableObject {
    projet_label?: string;
    projet_description?: string;
    projet_note?: string;
    projet_years?: string;
    commune?: string;
    lieu_dit?: string;
    type: string; // => ['Fouille programmée', 'Fouille préventive', 'Diagnostic', 'Autre']
    operateur: string;
    status?: string; // =>
    owner_uuid: string;
    write_lock_enabled: boolean;
    config: ApiConfig;
    users: Array<ApiUser>;
}

export interface ApiConfig {
    tags: Array<ApiConfigTag>;
}

export interface ApiConfigTag {
    tag_config_uuid: string;
    created: number;
    live: boolean;
    tag_custom: boolean;
    tag_config_default: boolean; // TRUE: if it's a default configuration
    /**
     * WARNING : VERROU APRES 1ER CONFIG
     */
    tag_system: TagSystem; // Type d'incrément disponible sur le backend
    tag_config_prefix: string; // PREFIX DU TAG : exemple FAIT => FT
    tag_config_separator1: string; // SEPARATOR : exemple "*"  US*0001
    tag_config_separator2: string; // SEPARATOR : exemple "+"  US*5+0001
    tag_config_digit: number; // REMBOURRAGE : Nombre de digit a remplir
    tag_priority: number; // default 0
    tag_show_date: boolean; // show date year as a separator;
    /**
     * WARNING : VERROU APRES 1ER CONFIG
     */
    tag_config_start_sequence: number; // Séquence de démarrage pour l'incrément
    table_name: ApiDbTable; // Configuration pour le TAG de la table cible
    table_name_display: string;
    projet_uuid: string; // Configuration pour le TAG de la table cible
    table_deprecated: boolean;
}

export enum TagSystem {
    CONTINUE = "951afe50-90f4-4a19-9320-63b4f5c7f5ca",
    SECTEUR = "65bbc206-7ec6-47c3-91d4-2cab00c80054",
    FAIT = "a117454a-91ea-4f5e-ab8b-195f014e2093",
    PSEUDO_SYSLAT = "7728d086-74df-4f9b-9b32-3fff2e867415",
    /**
     * UNIQUEMENT POUR (MOBILIER) = ECHANTILLON_MOBILIER
     */
    MOBILIER_US = "b75be489-91fa-4a52-8392-63c006ad25ec",
    MOBILIER_MATERIAU = "e0a867b6-c82f-4954-bc7d-ad8e92896e7a",
    MOBILIER_US_MATERIAU = "a97825f9-59a7-4061-a8ca-2eaeb7ecf9c1",
    MOBILIER_MATERIAU_US = "5ae03f43-642e-4f2c-8c24-ff192354fe6f",
    /**
     * UNIQUEMENT POUR (PRELEVEMENT) = ECHANTILLON_PRELEVEMENT
     */
    PRELEVEMENT_US = "d77eda8c-e0c9-4922-ad37-b2af4e8e2983",
    PRELEVEMENT_NATURE = "440a29f1-aa2c-41d9-b594-a6e8b8f723ae",
    PRELEVEMENT_US_NATURE = "7c981bac-3e29-4182-b223-b9042d82f994",
    PRELEVEMENT_NATURE_US = "2a9c235f-77f1-4ac9-96c4-a6643975ae46",
}

export interface ApiLinkProjetUser extends ApiSyncableObject {
    projet_uuid: string;
    user_uuid: string;
    user_access: string;
}

export interface ApiSecteur extends ApiSyncableObject {
    secteur_uuid: string;
    tag: string;
    tag_custom?: string;
    secteur_label?: string;
    secteur_type?: string;
    secteur_dim_largeur?: number;
    secteur_dim_longeur?: number;
    secteur_dim_profondeur?: number;
    secteur_dim_surface?: number;
    secteur_dim_volume?: number;
    secteur_notes?: string;
    secteur_z_inf?: number;
    secteur_z_sup?: number;
    projet_uuid: string;
    responsable: string; // user_uuid du responsable de secteur / different du owner du projet
}

export interface ApiSection extends ApiSyncableObject {
    section_uuid: string;
    projet_uuid: string;
    /**
     * 2023-07
     * Vincent
     * NOUVEAU CHAMP secteur pour le front
     */
    secteur_uuid: string;
    tag: string;
    tag_custom?: string;
    tag_hash?: string;
    section_label?: string;
    section_description?: string;
    section_dim_profondeur?: number;
    section_dim_largeur?: number;
    section_dim_longeur?: number;
    section_dim_superficie?: number;
    section_dim_volume?: number;
    section_notes?: string; // Remarques
    section_type?: string;
    section_z_inf?: number;
    section_z_sup?: number;
}

export interface ApiSectionCoupe extends ApiSection {
    section_coupe_uuid: string;
    coupe_label?: string;
    section_sondage_uuid?: string;
}

export interface ApiSectionSondage extends ApiSection {
    section_sondage_uuid: string;
}

export interface ApiStratigraphie extends ApiSyncableObject {
    stratigraphie_uuid: string;
    us_anterieur: string;
    us_posterieur: string;
    fait_anterieur: string;
    fait_posterieur: string;
    is_contemporain: boolean;
    strati_type_uuid: string;
}

export interface ApiTopo extends ApiSyncableObject {
    topo_uuid: string;
    tag: string;
    tag_custom?: string;
    tag_hash: string;
    topo_remarques?: string;
    topo_loc_x?: number;
    topo_loc_y?: number;
    topo_loc_z?: number;
    topo_levee?: boolean;
    topo_note?: string;
    topo_type_uuid?: string;
    topo_label?: string;
    /**
     * 07/08/23
     * Vincent
     * TAG Feature: Lors d'une configuration du TOPO avec tag par FAIT.
     * Le front doit SET le champ fait_uuid avec la valeur du 1er link. (ou champ qui pop pour cette config)
     * Seul solution pour que le TAG soit bien prit en compte.
     */
    fait_uuid?: string;
    /**
     * Felix
     * pareil que pour fait_uuid sauf que là c'est incrémentation par secteur
     */
    secteur_uuid?: string;
    projet_uuid: string;
}

export interface ApiUs extends ApiSyncableObject {
    us_uuid: string;
    tag: string;
    tag_custom?: string;
    tag_hash: string;
    // US_IDENTIFICATION
    us_identification_uuid?: string;
    us_label?: string;
    us_stat?: string;
    us_methode_manual?: boolean;
    us_methode_mechanical?: boolean;
    us_precision?: string;
    us_description?: string;
    us_validation?: boolean;
    us_dim_hauteur?: number;
    us_dim_largeur?: number;
    us_dim_longeur?: number;
    us_dim_reel_hauteur?: boolean;
    us_dim_reel_largeur?: boolean;
    us_dim_reel_longeur?: boolean;
    us_pendage?: number;
    us_z_borne?: number;
    us_z_calcul_lunette?: number;
    us_z_inf?: number;
    us_z_inf_bassin?: number;
    us_z_inf_pied?: number;
    us_z_inf_tete?: number;
    us_z_lecture?: number;
    us_z_sup?: number;
    us_alt_absolute_z_inf?: number;
    us_alt_absolute_z_supp?: number;
    secteur_uuid?: string;
    fait_uuid?: string;
    phase_uuid?: string;
    sous_divisions?: Array<ApiUsSousDivision>;
    us_strati_datation_mobilier_uuid?: string;
    us_phasage_uuid?: string;
    us_strati_note?: string;
    us_strati_archeometrie?: string;
}

export interface ApiUsSousDivision extends ApiSyncableObject {
    us_uuid?: string;
    us_sous_division_uuid?: string;
    number?: string;
    type_sous_division_uuid?: string;
    dimensions?: string;
    zsup?: string;
    zinf?: string;
    description?: string;
}

export interface ApiUsFourrure extends ApiSyncableObject {
    us_uuid?: string;
    us_fourrure_uuid?: string;
    us_fourrure_nature?: string;
    us_fourrure_module?: string;
    us_fourrure_dimensions?: number;
}

export interface ApiUsConstruiteNegatifs extends ApiSyncableObject {
    us_uuid?: string;
    us_construite_negatifs_uuid?: string;
    us_negatifs_type?: string;
    us_negatifs_number?: number;
    us_negatifs_hauteur?: number;
    us_negatifs_largeur?: number;
    us_negatifs_profondeur?: number;
}

export interface ApiUsConstruiteLiantNodules extends ApiSyncableObject {
    us_uuid?: string;
    us_liant_nodule_uuid?: string;
    us_liant_nodule_type?: string;
    us_liant_nodule_quantites?: string;
    us_liant_nodule_dimensions?: string;
}

export interface ApiUsConstruiteCharge {
    charge_limon: boolean;
    charge_sable: boolean;
    charge_petit_graviers: boolean;
    charge_gros_graviers: boolean;
    charge_cailloux: boolean;
}

export interface ApiUsConstruiteLiantInclusions extends ApiSyncableObject {
    us_uuid?: string;
    us_liant_inclusions_uuid?: string;
    us_liant_inclusions_nature?: string;
    us_liant_inclusions_frequence?: string;
}

export interface ApiUsConstruiteTracesDeTaille extends ApiSyncableObject {
    us_uuid?: string;
    us_traces_de_taille_uuid?: string;
    us_traces_de_taille_type?: string;
    us_traces_de_taille_position?: string;
}

export interface ApiUsConstruiteMarquesLapidaires extends ApiSyncableObject {
    us_uuid?: string;
    us_marques_lapidaires_uuid?: string;
    us_marques_lapidaires_type?: string;
    us_marques_lapidaires_nombre?: number;
    us_marques_lapidaires_localisation?: string;
    us_marques_lapidaires_description?: string;
}

export interface ApiUsBati extends ApiUs {
    us_bati_uuid: string;
    bati_info?: string;
}

export interface ApiUsConstruite extends ApiUs {
    us_construite_uuid: string;
    construite_info?: string;
    type_us_construite_uuid: string;
    us_mortal_type_uuid?: string;
    us_mortal_durete?: string;
    us_mortal_color?: string;
    us_mortal_inclusions_sable: boolean;
    us_mortal_inclusions_gravier: boolean;
    us_mortal_inclusions_cailloutis: boolean;
    us_mortal_inclusions_nodules_argile: boolean;
    us_mortal_inclusions_nodules_chaux: boolean;
    us_mortal_inclusions_tca: boolean;
    us_mortal_inclusions_charbons: boolean;
    us_mortal_inclusions_matiere_vegetale: boolean;
    us_joints?: string;
    us_enduit?: string;
    us_materials?: Array<ApiUsMaterial>;
    us_joints_de_lit?: number;
    us_joints_montants?: number;
    us_moulures?: string;
    us_remplois?: string;
    us_structure_appareil?: string;
    us_type_appareil?: string;
    us_module_appareil?: string;
    us_assises_form?: string;
    us_assises_nombre?: number;
    us_assises_hauteur_max?: number;
    us_assises_hauteur_min?: number;
    us_assises_hauteur_moyenne?: number;
    us_assises_calages?: string;
    us_fourrure_blocage?: Array<ApiUsFourrure>;
    us_construite_negatifs?: Array<ApiUsConstruiteNegatifs>;
    //Liant
    us_liant_type?: string;
    us_liant_couleur_matrice?: string;
    us_liant_nodules?: Array<ApiUsConstruiteLiantNodules>;
    us_liant_resistance?: string;
    us_liant_charge: ApiUsConstruiteCharge;
    us_liant_facies?: string;
    us_liant_inclusions?: Array<ApiUsConstruiteLiantInclusions>;
    us_liant_plannees_nombre?: number;
    us_liant_planees_descriptions?: string;
    us_traces_de_taille?: Array<ApiUsConstruiteTracesDeTaille>;
    us_traces_de_taille_bossage?: boolean;
    us_traces_de_taille_ciselure?: boolean;
    us_marques_lapidaires?: Array<ApiUsConstruiteMarquesLapidaires>;
}

export interface ApiUsMaterial extends ApiSyncableObject {
    us_uuid: string;
    us_construite_materiel_uuid: string;
    nature?: string;
    pourcent?: string;
    modules?: string;
    largeur_min?: number;
    largeur_max?: number;
    largeur_moyenne?: number;
    hauteur_min?: number;
    hauteur_max?: number;
    hauteur_moyenne?: number;
    profondeur_min?: number;
    profondeur_max?: number;
    profondeur_moyenne?: number;
}

export interface ApiUsNegative extends ApiUs {
    us_negative_uuid: string;
    negative_plan?: string;
    negative_profil?: string;
    negative_profil_longitudinal?: string;
}

export interface ApiUsPositive extends ApiUs {
    us_positive_uuid: string;
    positive_info?: string;
    positive_charbons?: string;
    positive_couleur?: string;
    positive_durete?: string;
    positive_homogeneite?: string;
    positive_inclusions_type_1?: string;
    positive_inclusions_type_2?: string;
    positive_inclusions_type_3?: string;
    positive_inclusions_granularite_1?: string;
    positive_inclusions_granularite_2?: string;
    positive_inclusions_granularite_3?: string;
    positive_perturbations_1?: string;
    positive_perturbations_2?: string;
    positive_perturbations_3?: string;
    positive_inclusions_frequence?: string;
    positive_nature1?: string;
    positive_nature2?: string;
}

export interface ApiUsSquelette extends ApiUs {
    us_squelette_uuid: string;
    squelette_info?: string;
    type_squelette_uuid?: number;
}

export interface ApiUsTechnique extends ApiUs {
    us_technique_uuid: string;
    technique_info?: string;
}

export interface ApiUser {
    auth_oid: string;
    user_uuid: string;
    user_first_name: string;
    user_last_name: string;
    user_email?: string;
    user_phone?: string;
    user_picture?: string;
    user_access_uuid: ApiRoleEnum;
    projet_role: ApiProjetRoleEnum;
}

export interface ApiSyncableObject extends ApiSyncable {
    author_uuid: string; // l'auteur de la version
    live: boolean; /// TOUJOURS à TRUE par défault ! live=false -> objet supprimer
    versions: Array<ApiSyncableObjectVersion>; // La liste des dates de sauvegarde de l'objet
    projet_uuid: string; // nécessaire pour le front, optionel pour le back. NULL si USER, ApiProjet ou autre objet externe à un projet
    tag_detail?: TagComposition;
}

export interface ApiSyncableObjectForTag extends ApiSyncableObject {
    section_uuid?: string;
    secteur_uuid?: string;
    echantillon_prelevement_uuid?: string;
    echantillon_mobilier_uuid?: string;
    us_uuid?: string;
    fait_uuid?: string;
    type_materiaux_uuid?: string;
    type_nature_uuid?: string;
}

export interface ApiSyncableObjectVersion {
    author: ApiUser;
    created: number;
    live: boolean;
}

export interface ApiSyncableType extends ApiSyncable {
    type_uuid: string;
    type_prefix: string;
    type_label: string;
    type_category_uuid: ApiTypeCategory;
    projet_uuid: string;
}

export interface ApiSyncableFile extends ApiSyncable {
    file_uuid: string;
    file: Blob;
    projet_uuid: string;
}

/***
 * INTERDICTION ABSOLU de modifier ces enum !!!
 */
export enum ApiTypeCategory {
    FAIT_IDENTIFICATION = "bad5c3ca-c1b1-49cb-9f6a-aec068e24e88",
    ENSEMBLE_IDENTIFICATION = "8950e0c6-2612-42d9-b647-0cf99887f97a",
    TEST_TYPE_CATEGORY = "359117dc-989b-4e49-9bb5-e1decd3dc0d5",
    US_IDENTIFICATION = "c30dc9e9-2df2-4e51-a78a-c11f0dc52acb",
    MOBILIER_IDENTIFICATION = "60224e81-6b87-4372-b048-e7fdc9bd0959",
    MOBILIER_ETAT = "85e9a9d5-28e8-4735-9181-e802995fa551",
    MOBILIER_MATERIAUX = "564968b7-e865-439e-9fb9-cfdf6279acba",
    PRELEVEMENT_NATURE = "ba773f22-e4cd-4ce9-b8f6-ec2c7b1df5cc",
    US_SOUS_DIVISION_TYPE = "11ceb397-7ade-4d94-bf2c-4d99be09143b", // Décapage | Carré | Passe
    US_POSITIVE_COMPOSANTE = "f4b0f955-f195-4737-a252-8950f66dd310",
    US_POSITIVE_INCLUSIONS = "333380d0-c820-4f0d-9131-e7c90d4fb082",
    US_POSITIVE_INCLUSIONS_GRANULARITE = "7061f2a5-a007-4416-b91b-b081f32664b0", // Rare | Fréquentes | Très fréquentes
    US_POSITIVE_PERTURBATION = "1e569164-e9be-4bd8-b508-bcd740510405",
    US_DURETE = "3380d412-2efd-4d5b-8599-efad89293057", // induré, compact, meuble, friable
    US_COLOR = "49f0cc0d-383f-4bd2-8960-46dae8815077", // Blanc, Bleu, Brun, Gris, Jaune, Marron, Noir, Rouge-
    US_POSITIVE_HOMOGENEITE = "936334c2-1af4-44b8-a833-644a8151743e", // Hétérogène, Homogène
    US_POSITIVE_COULEUR = "57b55692-7975-4726-8ee9-397216a7d281",
    US_POSITIVE_CHARBONS = "1cc1fb79-f475-4c0a-bda1-3724bd21afaa",
    US_POSITIVE_PLAN = "ffcc7cd8-b6b7-4129-aa0d-74d40c073f44",
    US_NEGATIVE_PROFIL = "2d939846-97a3-46af-9d7b-e1c381235c30",
    US_CONSTRUITE_MATERIAUX_NATURE = "21366c4b-12be-498c-988d-9251dc64edbc",
    US_CONSTRUITE_MATERIAUX_PERCENT = "44b7d378-aec3-4647-88c1-7ccc7568ad60", // exclusif, majoritaire, minoritaire
    US_CONSTRUITE_MATERIAUX_TAILLE = "b3720b55-bc68-4488-a438-c45ce3a92280", // régulière, irrégulière
    US_CONSTRUITE_MATERIAUX_FORME = "ba066c81-55d7-4d96-b757-2576ed470b89", // carré, rectangulaire, hexagonale, réticulée  , ovoide, irregulière, réticulée
    US_CONSTRUITE_MATERIAUX_MODULES = "4a3cf84a-1e62-4f6d-b1a4-cf2db019e8a5",
    US_CONSTRUITE_MORTIER_TYPE = "870497b9-0e24-4209-b2f4-aaa97d22f989", // Mortier de terre, Mortier de chaux, Sans, Mortier de tuileau
    US_CONSTRUITE_MORTIER_COULEUR = "870497b9-0e24-4209-b2f4-aaa97d22f990", // Couleur
    US_CONSTRUITE_MORTIER_DURETE = "870497b9-0e24-4209-b2f4-aaa97d22f991", // Durete
    US_CONSTRUITE_MORTIER_GRANULOMETRIE = "870497b9-0e24-4209-b2f4-aaa97d22f992", // GRANULOMETRIE
    US_ENDUIT = "870497b9-0e24-4209-b2f4-aaa97d22f993", // US_ENDUIT
    US_CONSTRUITE_SOL_TYPE = "89f82ce5-5c9c-4588-83ef-e0de0b140908", // sans enduit, enduit peint, mortier de chaux, ,ortier de tuillau, mortier moderne
    US_CONSTRUITE_JOINTS_TYPE = "8436f733-6a45-43c2-929d-1caca8cab0f9", // sans joint, joint plein, joint beurrés, joints retracés, joints tirées au fer, joints chanfreinées
    US_CONSTRUITE_STRUCTURE_APPAREIL = "e79d3c62-041f-4cf8-bd1e-c74926011f1e",
    US_CONSTRUITE_TYPE_APPAREIL = "da3dc2e4-929a-4a8c-888e-fc42b5b17e8a",
    US_CONSTRUITE_MODULE_APPAREIL = "3ae6b0fc-4c6f-46a6-86a1-50dc5179e4c7",
    US_CONSTRUITE_ASSISES_FORME = "dfb06a1e-95e0-4e3e-ae23-c014c9d7eec4",
    US_CONSTRUITE_ASSISES_CALAGES = "60671100-011d-412d-8022-017011111111",
    US_CONSTRUITE_FOURRURE_MODULE = "9f1a6b88-7c3b-4df5-b0d4-8f2e73e9a3fd",
    US_CONSTRUITE_FOURRURE_NATURE = "3c59f222-6a10-4b7d-a0ee-8f51b72b27d4",
    US_CONSTRUITE_NEGATIFS_TYPE = "b80b7a4c-1a96-41cf-b1fc-3f2c23bc87a6",
    US_SQUELETTE = "b80b7a4c-1a96-41cf-b1fc-3f2c23bc87a7",
    US_NEGATIVE_PROFIL_LONGITUDINAL = "b80b7a4c-1a96-41cf-b1fc-3f2c23bc87a8",
    // LIANT TYPE
    US_CONSTRUITE_LIANT_TYPE = "6e7c471a-43ee-476e-88fb-5e4fd7f6270e",
    US_CONSTRUITE_LIANT_COULEUR_MATRICE = "d0a1a3b2-9a51-48c1-9c75-1c870f3b54d6",
    US_CONSTRUITE_LIANT_NODULES_TYPE = "f6e8c5b7-38cb-4a02-9f69-7e6d055d6d70",
    US_CONSTRUITE_LIANT_NODULES_QUANTITES = "2b4f6c92-81d5-4f61-b768-78a7b4bff3f0",
    US_CONSTRUITE_LIANT_NODULES_DIMENSIONS = "e2bbf48e-643a-4a20-bc7a-fd82b8e0b3b5",
    US_CONSTRUITE_LIANT_RESISTANCE = "8a91de73-4c0f-45c7-b1c2-d4d5fcd26355",
    US_CONSTRUITE_LIANT_FACIES = "3e541df6-c2e4-4e83-9c73-3bb1a1e50415",
    US_CONSTRUITE_LIANT_INCLUSIONS_NATURE = "bb4ee9e4-4a77-42b3-8b49-0101bd362b66",
    US_CONSTRUITE_LIANT_INCLUSIONS_FREQUENCE = "d98b4ff9-11c2-4c67-b1b6-9a690a0197db",
    // ================
    US_CONSTRUITE_TRACES_TAILLE_TYPE = "bd0a83ee-1c71-4ad0-b3c3-2ac7fc729b2b",
    US_CONSTRUITE_TRACES_TAILLE_POSITION = "f3402576-4f25-47f5-8d8b-c5cf25149de2",
    US_CONSTRUITE_LAPIDAIRES_TYPE = "91d24be9-c10c-4f6e-a008-2e3dbde43a56",
    PRELEVEMENT_QUANTITE = "76515fef-6165-4605-8fd8-ce0ca4df3ee5",
    SONDAGE_TYPE = "11119901-a87b-43bd-b733-5de49eb17f17",
    MOBILIER_TYPE = "9e33ebca-0199-49a2-beb5-a790f90e4ade",
    MOBILIER_DATATION = "24e23548-a54c-4cab-b1fd-8c619ec9939e",
    //STRATIGRAPHIE_DATATION = '4c108a62-abfb-4dd9-bfe4-85c7e22b25b8',
    STRATIGRAPHIE_ANTERIEURE_TYPE = "21e52e59-8ee8-4200-b98b-b0f8d9c74e71",
    STRATIGRAPHIE_CONTEMPORAINE_TYPE = "f2882259-9592-4916-b2b9-f50f291fd2b5",
    STRATIGRAPHIE_POSTERIEURE_TYPE = "f255702a-1db6-46c7-b773-da11ff7377ef",
    PRELEVEMENT_ANALYSE = "7fbf4945-34e8-48bc-af8a-977dce45ff95",
    PRELEVEMENT_RESULTAT = "00a07d62-cc3d-4f2e-80a9-c1bc522adc31",
    PRELEVEMENT_ETAT = "c0c3bc5d-5a93-4235-8264-698992460e51",
    MINUTE_SUPPORT = "281c3a65-7028-4d20-8343-13ccf8aae3c8",
    MINUTE_ECHELLE = "281c3a65-7028-4d20-8343-13ccf8aae3c9",
    MINUTE_STATE = "94571ed6-d790-43de-aff1-87c9c2009c4d", // vectorisée / non-véctorisé
    PHOTO_TYPE = "a9545801-fa49-43d2-bd2e-22f0ff1f40f6",
    PHOTO_STATE = "a9545801-fa49-43d2-bd2e-22f0ff1f40f7",
    /**
     * PHOTO_VUE :
     *
     * Nord
     * Nord-est
     * Est
     * Sud-est
     * Sud
     * Sud-Ouest
     * Ouest
     * Nord-Ouest
     */
    PHOTO_VUE = "efc65b3b-f382-4dcf-b6ae-d9fc7e07d5fa",
    TOPO_TYPE = "4ff01860-a79b-4f1a-bcb5-d9e2fb08ec2f",
    MINUTES_SUPPORT = "3c983638-00b8-4c11-a544-86d3ad4cd53e", // Diff avec MINUTE_SUPPORT ???
    CONTENANT_TYPE = "ac8bac24-286e-44de-ae78-30f7221aea15",
    DATATION_STRATIGRAPHIE = "8007c5ad-3a66-4980-a12e-d8a1ab9c98ae", ///diff avec STRATIGRAPHIE_DATATION ???
    DATATION_MOBILIER = "4576ad7d-13b9-4c6a-8af6-61674cd9a395", /// difference avec MOBILIER_DATATION ???
    DATATION_ENSEMBLE = "02afd517-ef27-49a7-99e3-f1aa1a464d68", /// difference avec MOBILIER_DATATION ???
    US_PHASAGE = "c4f707f1-c31c-41da-8e8d-7d103a001967",
    /**
     * FAIT_FORME_PLAN :
     *
     * linéaire rectiligne
     * linéaire curviligne
     * linéaire polygonal
     * linéaire mixte
     * circulaire
     * ovalaire
     * oblong
     * ovoïde
     * rectangulaire
     * polylobé
     * irrégulier
     * indéterminé
     */
    FAIT_FORME_PLAN = "bbb3e7c5-888c-4f46-b3f6-c64f2a70f627",
    /**
     * FAIT_FORME_PROFIL :
     *
     * en cuvette
     * en auge
     * en U
     * en V
     * en bouteille
     * piriforme
     * irrégulier
     * indéterminé
     */
    FAIT_FORME_PROFIL = "d75bf14c-c44f-489a-ba19-af21964ae5e6",
    FAIT_ETAT = "96d1c718-077f-4419-a2aa-bb23ce5f4298", // 'Annulé',   'Non fouillé',   'Photographié',   'Sondage',   '50 %', '100 %'
    SECTEUR_IDENTIFICATION = "cb05790b-6968-47a9-b5a2-361f3d13e43b", // Zone ; Secteur ; Tranchée
    LINK_MINUTE_TYPE = "2f1394e4-dc4d-4130-8936-4d1e318440ac",
    LINK_MINUTE_SCALE = "b47c38c3-a9ec-445c-9d6c-8aa1cf93c503",
    DOCUMENT_TYPE = "b47c38c3-a9ec-445c-9d6c-8aa1cf93c504",
}

export interface ApiSyncable {
    table: ApiDbTable; /// OBLIGATOIRE !!!!!
    created?: number; // générer par la DB front
    draft?: boolean; /// true si Object pas enregistrer dans la DB backend
    error?: Array<unknown>; /// informations relatives à des problèmes de merge
}

export interface ApiBatchExchangeRequest<T extends ApiSyncable> {
    list: Array<ApiDbExchange<T>>; /// une liste d'objets à synchroniser entre front & back
    errorIfAlreadySave?: boolean;
}

export interface ApiBatchExchangeReplyIndex<T extends ApiSyncable> {
    list: Array<ApiDbExchange<T>>; /// une liste d'objets à synchroniser entre front & back
    error?: Array<{
        data: ApiSyncableObjectIndex;
        error: ApiError;
    }>; /// une liste d'objets à synchroniser entre front & back
}

export interface ApiBatchExchangeReplySync<T extends ApiSyncable> {
    list: Array<ApiDbExchange<T>>; /// une liste d'objets à synchroniser entre front & back
    error?: Array<{
        data: ApiDbExchange<T>;
        error: ApiError;
    }>; /// une liste d'objets à synchroniser entre front & back
}

export enum ApiDbTable {
    contenant = "contenant",
    document = "document",
    document_photo = "document_photo",
    document_minute = "document_minute",
    echantillon = "echantillon",
    echantillon_mobilier = "echantillon_mobilier",
    echantillon_prelevement = "echantillon_prelevement",
    ensemble = "ensemble",
    fait = "fait",
    gps = "gps",
    file = "file",
    link_contenant_echantillon = "link_contenant_echantillon",
    link_document_echantillon = "link_document_echantillon",
    link_document_fait = "link_document_fait",
    link_document_section = "link_document_section",
    link_document_us = "link_document_us",
    link_ensemble_document = "link_ensemble_document",
    link_ensemble_fait = "link_ensemble_fait",
    link_ensemble_us = "link_ensemble_us",
    link_secteur_gps = "link_secteur_gps",
    link_section_ensemble = "link_section_ensemble",
    link_section_fait = "link_section_fait",
    link_section_us = "link_section_us",
    link_topo_document = "link_topo_document",
    link_topo_echantillon = "link_topo_echantillon",
    link_topo_ensemble = "link_topo_ensemble",
    link_topo_fait = "link_topo_fait",
    link_topo_section = "link_topo_section",
    link_topo_us = "link_topo_us",
    mouvement = "mouvement",
    phase = "phase",
    projet = "projet",
    projet_user = "projet_user",
    secteur = "secteur",
    section = "section",
    section_sondage = "section_sondage",
    section_coupe = "section_coupe",
    stratigraphie = "stratigraphie",
    topo = "topo",
    type = "type",
    type_category = "type_category",
    user_access = "user_access",
    us = "us",
    us_sous_division = "us_sous_division",
    us_bati = "us_bati",
    us_construite = "us_construite",
    us_construite_charge = "us_construite_charge",
    us_construite_materiel = "us_construite_materiel",
    us_construite_liant_inclusions = "us_construite_liant_inclusions",
    us_construite_liant_nodules = "us_construite_liant_nodules",
    us_construite_marques_lapidaires = "us_construite_marques_lapidaires",
    us_construite_traces_de_taille = "us_construite_traces_de_taille",
    us_negative = "us_negative",
    us_positive = "us_positive",
    us_squelette = "us_squelette",
    us_technique = "us_technique",
    us_fourrure = "us_fourrure",
    user = "user",
}

export enum ApiDbExchanceStatus {
    success,
    conflit,
    request,
}

export enum ApiDbExchangeType {
    RETRIEVE,
    CREATE,
}

export interface ApiDbExchange<T extends ApiSyncable> {
    action: ApiDbExchangeType;
    status: ApiDbExchanceStatus;
    data: T;
}

export interface ApiProjectIndex {
    amount_objects: number;
    projet_uuid: string;
    last_updated: number;
    index: Array<ApiSyncableObjectIndex>;
}

export interface ApiSyncableObjectIndex {
    draft?: boolean;
    error?: unknown;
    projet_uuid?: string;
    key: string;
    value: string;
    created: number;
    table: ApiDbTable;
}

export interface ApiBatchProjetIndexRequest {
    projets: Array<{
        projet_uuid: string;
        last_synchro_ms?: number;
    }>;
    spam_me: boolean; // Send data ASYNC with NOTIFY action
}

export interface ApiBatchProjetIndexReply {
    projets: Array<ApiProjectIndex>;
}

export interface ApiProjetUserRequest {
    projet_uuid: string;
    user_uuid: string;
    access: "ALLOW" | "DENY";
    role: ApiProjetRoleEnum;
}

export interface ApiProjetUserResponse {
    projet_uuid: string;
    users: Array<ApiUser>;
}

export interface TagComposition {
    tag: string;
    tag_digit: number;
    system: TagSystem;
    config: Array<TagCompositionValue>;
    order?: Array<TagCompositionType>; // NOT REQUIRE : default value exist in code
}

export interface TagCompositionValue {
    title: TagCompositionType;
    value: string;
    separator: string;
    priority?: number;
}

export enum TagCompositionType {
    prefix = "prefix",
    date = "date",
    tag_composition = "tag_composition",
    heritage_increment = "heritage_increment",
    rembourrage = "rembourrage",
    tag_increment = "tag_increment",
}

export interface TagParameters {
    table: string;
    projet_uuid: string;
    tag_increment: number;
    data: ApiSyncableObjectForTag;
    order?: Array<TagCompositionType>;
}
