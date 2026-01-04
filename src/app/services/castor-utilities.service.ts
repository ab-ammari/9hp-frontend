import {Injectable} from '@angular/core';
import {WorkerService} from "./worker.service";
import {dbBoundObject} from "../DataClasses/models/db-bound-object";
import {
  ApiDbTable,
  ApiEchantillonMobilier,
  ApiEchantillonPrelevement,
  ApiEnsemble,
  ApiFait,
  ApiSection, ApiStratigraphie,
  ApiUs
} from "../../../shared";
import {ExcavationStatus} from "../../../shared/objects/models/enums/ExcavationStatus";
import {MobilierStatEnum} from "../../../shared/objects/models/enums/MobilierStatEnum";
import {PrelevementStatEnum} from "../../../shared/objects/models/enums/PrelevementStatEnum";

@Injectable({
  providedIn: 'root'
})
export class CastorUtilitiesService {

  constructor(private w: WorkerService) {
  }

  /* Get ALL Object of a Sector */
  public getAllSectorFaits(secteur_uuid: string): Array<dbBoundObject<ApiFait>> {
    return this.w.data().objects.fait.all.list?.filter(
      fait => fait.item.secteur_uuid === secteur_uuid);
  }

  public getAllSectorUS(secteur_uuid: string): Array<dbBoundObject<ApiUs>> {
    return this.w.data().objects.us.all.list?.filter(
      us => us.item.secteur_uuid === secteur_uuid);
  }

  public getAllSectorEnsemble(secteur_uuid: string): Array<dbBoundObject<ApiEnsemble>> {
    /* Get all Ensemble from FAIT / US of Sector */
    const Faits = this.getAllSectorFaits(secteur_uuid);
    const US = this.getAllSectorUS(secteur_uuid);

    let Ensembles = this.w.data().links.link_ensemble_fait.all.list?.filter(
      link => Faits?.some(fait => fait.item.fait_uuid === link.item.fait_uuid))
      ?.map(link => this.w.data().objects.ensemble.all.list?.find(ensemble => ensemble.item.ensemble_uuid === link.item.ensemble_uuid));

    Ensembles.push(
      ...this.w.data().links.link_ensemble_us.all.list?.filter(
        link => US?.some(us => us.item.us_uuid === link.item.us_uuid))
        ?.map(link => this.w.data().objects.ensemble.all.list?.find(ensemble => ensemble.item.ensemble_uuid === link.item.ensemble_uuid)));
    // Remove duplicate
    Ensembles = Ensembles?.filter((element, index) => Ensembles.indexOf(element) === index);
    return Ensembles;
  }

  public getAllSectorSondages(secteur_uuid: string): Array<dbBoundObject<ApiSection>> {
    const Faits = this.getAllSectorFaits(secteur_uuid) ?? [];
    const Mobiliers = this.getAllSectorMobiliers(secteur_uuid) ?? [];
    const Prelevement = this.getAllSectorPrelevements(secteur_uuid) ?? [];
    const Ensembles = this.getAllSectorEnsemble(secteur_uuid) ?? [];

    const sondage_fait = this.w.data().links.link_section_fait.all?.list?.filter(
      link_fait => Faits?.some(fait => link_fait.item.fait_uuid === fait.item.fait_uuid)
    )?.map(link => this.w.data().objects.section.all.list
      ?.find(section => section.item.section_uuid === link.item.section_uuid)
    );

    const sondage_Echantillon = this.w.data().objects.section.all.list.filter((section) => {
      section.info.obj_table === ApiDbTable.section_sondage &&
      [...Mobiliers, ...Prelevement]?.some(echantillon => section.item.section_uuid === echantillon.item.section_uuid)
    });


    const sondage_Ensemble = this.w.data().links.link_section_ensemble.all?.list?.filter(
      link_ensemble => Ensembles?.some(ensemble => link_ensemble.item.ensemble_uuid === ensemble.item.ensemble_uuid)
    )?.map(link => this.w.data().objects.section.all?.list
      ?.find(section => section.item.section_uuid === link.item.section_uuid)
    );
    let Sondages = [...sondage_fait, ...sondage_Echantillon, ...sondage_Ensemble];
    // Remove doublon
    Sondages = Sondages?.filter((element, index) => Sondages.indexOf(element) === index);
    return Sondages;
  }

  public getAllSectorMobiliers(secteur_uuid: string): Array<dbBoundObject<ApiEchantillonMobilier>> {
    const US = this.getAllSectorUS(secteur_uuid);
    return this.w.data().objects.echantillon.all.childList(ApiDbTable.echantillon_mobilier)
      ?.filter(mobilier => US?.some(us => us.item.us_uuid === mobilier.item.us_uuid)) as Array<dbBoundObject<ApiEchantillonMobilier>>;
  }

  public getAllSectorPrelevements(secteur_uuid: string): Array<dbBoundObject<ApiEchantillonPrelevement>> {
    const US = this.getAllSectorUS(secteur_uuid);
    return this.w.data().objects.echantillon.all.childList(ApiDbTable.echantillon_prelevement)
      ?.filter(prelevement => US?.some(us => us.item.us_uuid === prelevement.item.us_uuid)) as Array<dbBoundObject<ApiEchantillonPrelevement>>;
  }

  public getAllSectorMinutes(secteur_uuid: string) {
    const US = this.getAllSectorUS(secteur_uuid);
    const Faits = this.getAllSectorFaits(secteur_uuid);
    const Sondages = this.getAllSectorSondages(secteur_uuid);
    const Echantillons = this.w.data().objects.echantillon.all?.list
      ?.filter(echantillon => US?.some(us => us.item.us_uuid === echantillon.item.us_uuid));

    const minute_fait = this.w.data().links.link_document_fait.all?.list?.filter(
      link_fait => Faits?.some(fait => link_fait.item.fait_uuid === fait.item.fait_uuid))
      ?.map(link => this.w.data().objects.document.all.childList(ApiDbTable.document_minute)
        ?.find(minute => minute.item.document_uuid === link.item.document_uuid));

    const minute_us = this.w.data().links.link_document_us.all?.list
      ?.filter(link_us => US?.some(us => link_us.item.us_uuid === us.item.us_uuid))
      ?.map(link => this.w.data().objects.document.all.childList(ApiDbTable.document_minute)
        ?.find(minute => minute.item.document_uuid === link.item.document_uuid));

    const minute_sondage = this.w.data().links.link_document_section.all?.list
      ?.filter(link_section => Sondages?.some(section => link_section.item.section_uuid === section.item.section_uuid))
      ?.map(link => this.w.data().objects.document.all?.childList(ApiDbTable.document_minute)
        ?.find(minute => minute.item.document_uuid === link.item.document_uuid));

    const minute_echantillon = this.w.data().links.link_document_echantillon.all?.list
      ?.filter(link_echantillon => Echantillons?.some(echantillon => echantillon.item.echantillon_uuid === link_echantillon.item.echantillon_uuid))
      ?.map(link => this.w.data().objects.document.all?.childList(ApiDbTable.document_minute)
        ?.find(minute => minute.item.document_uuid === link.item.document_uuid));

    let Minutes = [...minute_fait, ...minute_us, ...minute_sondage, ...minute_echantillon];
    Minutes = Minutes?.filter((element, index) => Minutes.indexOf(element) === index);

    return Minutes;
  }

  public getAllSectorPhotos(secteur_uuid: string) {
    const US = this.getAllSectorUS(secteur_uuid);
    const Faits = this.getAllSectorFaits(secteur_uuid);
    const Sondages = this.getAllSectorSondages(secteur_uuid);
    const Echantillons = this.w.data().objects.echantillon.all?.list
      ?.filter(echantillon => US?.some(us => us.item.us_uuid === echantillon.item.us_uuid));

    const photo_fait = this.w.data().links.link_document_fait.all?.list?.filter(
      link_fait => Faits?.some(fait => link_fait.item.fait_uuid === fait.item.fait_uuid))
      ?.map(link => this.w.data().objects.document.all.childList(ApiDbTable.document_photo)
        ?.find(minute => minute.item.document_uuid === link.item.document_uuid));

    const photo_us = this.w.data().links.link_document_us.all?.list
      ?.filter(link_us => US?.some(us => link_us.item.us_uuid === us.item.us_uuid))
      ?.map(link => this.w.data().objects.document.all.childList(ApiDbTable.document_photo)
        ?.find(minute => minute.item.document_uuid === link.item.document_uuid));

    const photo_sondage = this.w.data().links.link_document_section.all?.list
      ?.filter(link_section => Sondages?.some(section => link_section.item.section_uuid === section.item.section_uuid))
      ?.map(link => this.w.data().objects.document.all?.childList(ApiDbTable.document_photo)
        ?.find(minute => minute.item.document_uuid === link.item.document_uuid));

    const photo_echantillon = this.w.data().links.link_document_echantillon.all?.list
      ?.filter(link_echantillon => Echantillons?.some(echantillon => echantillon.item.echantillon_uuid === link_echantillon.item.echantillon_uuid))
      ?.map(link => this.w.data().objects.document.all?.childList(ApiDbTable.document_photo)
        ?.find(minute => minute.item.document_uuid === link.item.document_uuid));

    let Photos = [...photo_fait, ...photo_us, ...photo_sondage, ...photo_echantillon];
    Photos = Photos?.filter((element, index) => Photos.indexOf(element) === index);

    return Photos;
  }

  public getAllSectorTopos(secteur_uuid: string) {
    // TODO : Later
  }

  /* Average Stats stuff */
  public getAverageFaitUsStatSector(secteur_uuid: string): ExcavationStatus {
    // Get us sector and remove canceled/photographed
    const US = this.getAllSectorUS(secteur_uuid)
      ?.filter(us => us.item.us_stat !== ExcavationStatus.CANCELED && us.item.us_stat !== ExcavationStatus.PHOTOGRAPHED);
    // Get faits sector and remove canceled/photographed
    const Faits = this.getAllSectorFaits(secteur_uuid)
      ?.filter(fait => fait.item.fait_stat_uuid !== ExcavationStatus.CANCELED && fait.item.fait_stat_uuid !== ExcavationStatus.PHOTOGRAPHED);

    const usFaitAverageStat = this.calculAverageFaitUsStats(US, Faits);

    if (usFaitAverageStat < 20) {
      return ExcavationStatus.UNEXCAVATED;
    } else if (usFaitAverageStat >= 20 && usFaitAverageStat < 50) {
      return ExcavationStatus.SONDAGE;
    } else if (usFaitAverageStat >= 50 && usFaitAverageStat !== 100) {
      return ExcavationStatus.FIFTY_PERCENT;
    } else {
      return ExcavationStatus.HUNDRED_PERCENT
    }
  }

  public getAverageFaitUsStatEnsemble(ensemble_uuid: string): ExcavationStatus {
    // Get us ensemble and remove canceled/photographed
    const UsEnsemble = this.w.data().links.link_ensemble_us.all?.list
      ?.filter(link => link.item.ensemble_uuid === ensemble_uuid)
      ?.map(link => this.w.data().objects.us.all?.list?.find(us => us.item.us_uuid === link.item.us_uuid))
      ?.filter(us => us.item.us_stat !== ExcavationStatus.CANCELED && us.item.us_stat !== ExcavationStatus.PHOTOGRAPHED);
    // Get faits ensemble and remove canceled/photographed
    const FaitEnsemble = this.w.data().links.link_ensemble_fait?.all?.list
      ?.filter(link => link.item.ensemble_uuid === ensemble_uuid)
      ?.map(link => this.w.data().objects.fait.all?.list?.find(fait => fait.item.fait_uuid === link.item.fait_uuid))
      ?.filter(fait => fait.item.fait_stat_uuid !== ExcavationStatus.CANCELED && fait.item.fait_stat_uuid !== ExcavationStatus.PHOTOGRAPHED);

    const EnsembleUsFaitAverageStat = this.calculAverageFaitUsStats(UsEnsemble, FaitEnsemble);

    if (EnsembleUsFaitAverageStat < 20) {
      return ExcavationStatus.UNEXCAVATED;
    } else if (EnsembleUsFaitAverageStat >= 20 && EnsembleUsFaitAverageStat < 50) {
      return ExcavationStatus.SONDAGE;
    } else if (EnsembleUsFaitAverageStat >= 50 && EnsembleUsFaitAverageStat !== 100) {
      return ExcavationStatus.FIFTY_PERCENT;
    } else {
      return ExcavationStatus.HUNDRED_PERCENT
    }
  }

  public calculAverageFaitUsStats(us: Array<dbBoundObject<ApiUs>>, faits: Array<dbBoundObject<ApiFait>>): number {

    let usFaitAverageStat = 0;

    const max = us?.length + faits?.length;
    if (!max) {
      return 0;
    }
    // Count average stat
    us?.forEach(us => {
      switch (us.item.us_stat) {
        case ExcavationStatus.UNEXCAVATED:
          usFaitAverageStat += 0;
          break;
        case ExcavationStatus.SONDAGE:
          usFaitAverageStat += 20;
          break;
        case ExcavationStatus.FIFTY_PERCENT:
          usFaitAverageStat += 50;
          break;
        case ExcavationStatus.HUNDRED_PERCENT:
          usFaitAverageStat += 100;
          break;
      }
    });
    faits?.forEach(fait => {
      switch (fait.item.fait_stat_uuid) {
        case ExcavationStatus.UNEXCAVATED:
          usFaitAverageStat += 0;
          break;
        case ExcavationStatus.SONDAGE:
          usFaitAverageStat += 20;
          break;
        case ExcavationStatus.FIFTY_PERCENT:
          usFaitAverageStat += 50;
          break;
        case ExcavationStatus.HUNDRED_PERCENT:
          usFaitAverageStat += 100;
          break;
      }
    });

    usFaitAverageStat = Math.round(usFaitAverageStat / max);
    return usFaitAverageStat;
  }

  /* Contenant stuff */
  public getAllMobilierContenant(contenant_uuid: string): Array<dbBoundObject<ApiEchantillonMobilier>> {
    return this.w.data().links.link_contenant_echantillon.all?.list
      ?.filter(link => link.item.contenant_uuid === contenant_uuid)
      ?.map(link => this.w.data().objects.echantillon.all?.childList(ApiDbTable.echantillon_mobilier)
        ?.find(mobilier => mobilier?.item?.echantillon_uuid === link.item.echantillon_uuid))
      ?.filter(item => item !== undefined) as Array<dbBoundObject<ApiEchantillonMobilier>>;
  }

  public getAllMateriauxMobilier(mobiliers: Array<dbBoundObject<ApiEchantillonMobilier>>): string {
    return mobiliers?.map(item => this.w.data().types?.list
      ?.find( type => type?.type_uuid === item?.item?.type_materiaux_uuid)?.type_label).join(', ');
  }

  public getAllPrelevementContenant(contenant_uuid: string): Array<dbBoundObject<ApiEchantillonPrelevement>> {
    return this.w.data().links.link_contenant_echantillon.all?.list
      ?.filter(link => link.item.contenant_uuid === contenant_uuid)
      ?.map(link => this.w.data().objects.echantillon.all?.childList(ApiDbTable.echantillon_prelevement)
        ?.find(prelevement => prelevement?.item?.echantillon_uuid === link.item.echantillon_uuid))
      ?.filter(item => item !== undefined) as Array<dbBoundObject<ApiEchantillonPrelevement>>;
  }

  public getAllNaturesPrelevement(prelevements: Array<dbBoundObject<ApiEchantillonPrelevement>>): string {
    return prelevements?.map(item => this.w.data().types?.list
      ?.find(type => type?.type_uuid === item?.item?.type_nature_uuid)?.type_label).join(', ');
  }

  public calcAvEchantillonContenantStatPercent(contenant_uuid: string): number {
    /* Get Mobilier contenant */
    let MobiContenant = this.getAllMobilierContenant(contenant_uuid);
    MobiContenant = MobiContenant?.filter(mobi => mobi?.item?.mobilier_etat_uuid !== MobilierStatEnum.DECLASSE);
    /*Get Prelevement contenant */
    const PrelevContenant = this.getAllPrelevementContenant(contenant_uuid);

    let avPercentMobiPrelStat: number = 0;
    const maxMobiPrel = MobiContenant?.length + PrelevContenant?.length;
    if (!maxMobiPrel) {
      return 0;
    }
    /* Calc percent of stat */
    MobiContenant?.forEach(mobil => {
      switch (mobil?.item?.mobilier_etat_uuid) {
        case MobilierStatEnum.NON_LAVEE:
          avPercentMobiPrelStat += 0;
          break;
        case MobilierStatEnum.NON_CONSERVE:
        case MobilierStatEnum.NON_PRELEVE:
          avPercentMobiPrelStat += 50;
          break;
        case MobilierStatEnum.LAVE:
        case MobilierStatEnum.STABILISE:
          avPercentMobiPrelStat += 100;
          break;
      }
    });
    PrelevContenant?.forEach(prelev => {
      switch (prelev?.item?.prelevement_etat) {
        case PrelevementStatEnum.NON_TRAITE:
          avPercentMobiPrelStat += 0;
          break;
        case PrelevementStatEnum.NON_CONSERVE:
         avPercentMobiPrelStat += 50;
         break
        case PrelevementStatEnum.TRAITE:
          avPercentMobiPrelStat += 100;
          break;
      }
    });
    avPercentMobiPrelStat = Math.round( avPercentMobiPrelStat / maxMobiPrel);
    return avPercentMobiPrelStat;
  }

  /* Minutes stuff */
  public getAllMinuteLinkedFaits(document_uuid: string): Array<dbBoundObject<ApiFait>> {
    return this.w.data().links.link_document_fait.all?.list
      ?.filter(link => link.item.document_uuid === document_uuid)
      ?.map(link => this.w.data().objects.fait.all.list?.find(fait => fait.item.fait_uuid === link.item.fait_uuid));
  }

  /* Us Stratigraphie */
  public getStratigraphie(uuid: string): {
    anterieur: Array<ApiStratigraphie>;
    contemporain: Array<ApiStratigraphie>;
    posterieur: Array<ApiStratigraphie>;
  } {

    const anterieur: Array<ApiStratigraphie> = [];
    const contemporain: Array<ApiStratigraphie> = [];
    const posterieur: Array<ApiStratigraphie> = [];

    const fullList = this.w.data().objects.stratigraphie.all.list
      .filter(strat => {
      return [
        strat.item.stratigraphie_uuid,
        strat.item.us_posterieur,
        strat.item.us_anterieur,
        strat.item.fait_anterieur,
        strat.item.fait_posterieur
      ].includes(uuid);
    }).map(item => item.item).filter(item => item.live);

    if (fullList?.length > 0) {
      fullList.forEach(strat => {
        if (strat.is_contemporain) {
          contemporain.push(strat);
        } else {
          if (strat.us_anterieur === uuid || strat.fait_anterieur === uuid) {
            posterieur.push(strat);
          }
          if (strat.us_posterieur === uuid || strat.fait_posterieur === uuid){
            anterieur.push(strat);
          }
        }
      });
    }
    return {anterieur, posterieur, contemporain};
  }

  /* Dimension display */
  public dimensionToMeter(value: number, mode: 'classic' | 'surface' | 'volume' = 'classic'): number {
    if (value) {
      switch (mode) {
        case "classic":
          return value / 1000;
        case "surface":
          return value / Math.pow(10, 6);
        case "volume":
          return value / Math.pow(10, 9);
        default:
          return 0;
      }
    } else {
      return 0;
    }
  }

  public truncate( str: string, n: number, useWordBoundary: boolean = false ): string | null {
    if (!str) { return null}
    if (str?.length <= n) { return str; }
    const subString = str?.slice(0, n-1); // the original check
    return (useWordBoundary
      ? subString?.slice(0, subString?.lastIndexOf(" "))
      : subString) + "...";
  };

}
