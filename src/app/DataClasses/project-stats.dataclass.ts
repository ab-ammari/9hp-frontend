import {LOG, LoggerContext} from "ngx-wcore";

const CONTEXT: LoggerContext = {
  origin: 'ProjectStatsDataclass'
}
export interface StatsData {
  name: string;
  value: number;
}

export interface SectorSelection {
  secteur_uuid: string;
  secteur_tag: string;
  selected: boolean;
}

export class ProjectStatsDataclass {

  histogrammeData: Array<StatsData>;
  pieStatsData: Array<StatsData>;
  pieMethodeTypeData: Array<StatsData>;

  searchProgress: number;
  sheetsProgress: number;
  sheetsValidationProgress: number;

  selectedDisplayFilter: 'Faits' | 'US' | 'Mobilier' | 'Prélevements' | 'Contenant';
  selectedSector: Array<SectorSelection>;

  constructor() {
    LOG.debug.log({...CONTEXT});
    this.setDefault();
  }

  setDefault() {
    this.histogrammeData = [];
    this.pieStatsData = [];
    this.pieMethodeTypeData = [];

    this.searchProgress = 0;
    this.sheetsProgress = 0;
    this.sheetsValidationProgress = 0;
    this.selectedDisplayFilter = 'Faits';
    this.selectedSector = [];
  }
}
