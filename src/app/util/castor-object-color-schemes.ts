import {
  ApiContenant,
  ApiDocumentMinute, ApiDocumentPhoto,
  ApiEchantillonMobilier,
  ApiEchantillonPrelevement,
  ApiEnsemble,
  ApiFait,
  ApiSecteur, ApiTopo,
  ApiUs
} from "../../../shared";
import {ExcavationStatus} from "../../../shared/objects/models/enums/ExcavationStatus";
import {CastorUtilitiesService} from "../services/castor-utilities.service";
import {MobilierStatEnum} from "../../../shared/objects/models/enums/MobilierStatEnum";
import {PrelevementStatEnum} from "../../../shared/objects/models/enums/PrelevementStatEnum";
import {MinuteStatEnum} from "../../../shared/objects/models/enums/MinuteStatEnum";
import {LOG, LoggerContext} from "ngx-wcore";

export class CastorObjectColorSchemes {
}

const CONTEXT: LoggerContext = {
  origin: 'CastorObjectColorSchemes'
}

export function getSectorColors(sector: ApiSecteur, utils: CastorUtilitiesService): string {
  switch (utils.getAverageFaitUsStatSector(sector?.secteur_uuid)) {
    case ExcavationStatus.UNEXCAVATED:
      return '#E7411B'
    case ExcavationStatus.FIFTY_PERCENT:
      return '#F49935'
    case ExcavationStatus.SONDAGE:
      return "#FFD618"
    case ExcavationStatus.HUNDRED_PERCENT:
      return '#76B99C'
    default:
      return '#E7411B';
  }
}

export function getFaitColors(fait: ApiFait): string {
  switch (fait?.fait_stat_uuid) {
    case ExcavationStatus.UNEXCAVATED:
      return '#E7411B'
    case ExcavationStatus.PHOTOGRAPHED:
      return '#F49935'
    case ExcavationStatus.FIFTY_PERCENT:
    case ExcavationStatus.SONDAGE:
      return "#FFD618"
    case ExcavationStatus.HUNDRED_PERCENT:
      return '#76B99C'
    default:
      return '#E7411B';
  }
}

export function getUSColors(us: ApiUs): string {
  switch (us?.us_stat) {
    case ExcavationStatus.UNEXCAVATED:
      return '#E7411B'
    case ExcavationStatus.PHOTOGRAPHED:
      return '#F49935'
    case ExcavationStatus.FIFTY_PERCENT:
    case ExcavationStatus.SONDAGE:
      return "#FFD618"
    case ExcavationStatus.HUNDRED_PERCENT:
      return '#76B99C'
    default:
      return '#E7411B';
  }
}

export function getEnsembleColors(ensemble: ApiEnsemble, utils: CastorUtilitiesService): string {
  switch (utils.getAverageFaitUsStatEnsemble(ensemble?.ensemble_uuid)) {
    case ExcavationStatus.UNEXCAVATED:
      return '#E7411B'
    case ExcavationStatus.FIFTY_PERCENT:
      return '#F49935'
    case ExcavationStatus.SONDAGE:
      return "#FFD618"
    case ExcavationStatus.HUNDRED_PERCENT:
      return '#76B99C'
    default:
      return '#E7411B';
  }
}

export function getMobilierColors(mobilier: ApiEchantillonMobilier): string {
  switch (mobilier?.mobilier_etat_uuid) {
    case MobilierStatEnum.NON_LAVEE:
      return '#F49935';
    case MobilierStatEnum.LAVE:
    case MobilierStatEnum.STABILISE:
      return '#76B99C';
    case MobilierStatEnum.NON_PRELEVE:
    case MobilierStatEnum.NON_CONSERVE:
      return "#FFD618";
    default:
      return '#E7411B';
  }
}

export function getPrelevementColors(prelevement: ApiEchantillonPrelevement): string {
  switch (prelevement?.prelevement_etat) {
    case PrelevementStatEnum.NON_TRAITE:
      return '#F49935';
    case PrelevementStatEnum.TRAITE:
      return '#76B99C';
    case PrelevementStatEnum.NON_CONSERVE:
      return '#FFD618'
    default:
      return '#E7411B';
  }
}

export function getMinuteColors(minute: ApiDocumentMinute): string {
  switch (minute?.minute_state_uuid) {
    case MinuteStatEnum.VECTORISEE:
      return '#76B99C';
    case MinuteStatEnum.NON_VECTORISEE:
      return '#F49935';
    default:
      return '#E7411B';
  }
}

export function getPhotoColors(photo: ApiDocumentPhoto): string {
  return photo?.document_file_uuid ? '#76B99C' : '#F49935';
}

export function getTopoColors(topo: ApiTopo): string {
  return topo?.topo_levee ? '#76B99C' : '#F49935';
}

export function getContenantColors(contenant: ApiContenant, utils: CastorUtilitiesService): string {
  const averagePercent = utils.calcAvEchantillonContenantStatPercent(contenant?.contenant_uuid);
  if (averagePercent < 50) {
    return '#F49935';
  } else if (averagePercent >= 50 && averagePercent < 100) {
    return '#FFD618';
  } else {
    return '#76B99C';
  }
}
