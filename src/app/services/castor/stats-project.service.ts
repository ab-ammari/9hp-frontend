import {Injectable} from '@angular/core';
import {AbstractService, CoreModule, LOG, LoggerContext, Trigger} from "ngx-wcore";
import {WorkerService} from "../worker.service";
import {SectorSelection} from "../../DataClasses/project-stats.dataclass";
import {A} from "../../Core-event";
import {dbBoundObject} from "../../DataClasses/models/db-bound-object";
import {ApiDbTable, ApiEchantillonMobilier, ApiEchantillonPrelevement, ApiSyncableObject} from "../../../../shared";
import {ExcavationStatus} from "../../../../shared/objects/models/enums/ExcavationStatus";
import {CastorUtilitiesService} from "../castor-utilities.service";

const CONTEXT: LoggerContext = {
  origin: 'StatsProjectService'
}

@Injectable({
  providedIn: CoreModule
})
export class StatsProjectService extends AbstractService {

  constructor(protected w: WorkerService, private utiles: CastorUtilitiesService) {
    super(w);
    this.linkTriggers([
      new Trigger(A.initStats, () => this.initData()),
      new Trigger(A.updateData, () => this.updateData())
    ]);
  }

  initData() {
    /* Init array */
    this.resetData();
    this.initSectionSelection();
    this.buildAllData();
    this.calcAllProgress()
  }

  updateData() {
    this.buildAllData();
    this.calcAllProgress();
  }

  calcAllProgress() {
    this.calcSheetProgress();
    this.calcValidationProgression();
    this.calcSearchProgress();
  }

  buildAllData() {
    switch (this.w.data().projectStats.selectedDisplayFilter) {
      case "Faits":
        this.filterFaitData();
        break;
      case "US":
        this.filterUsData();
        break;
      case "Mobilier":
        this.filterMobilierData();
        break;
      case "Prélevements":
        this.filterPrelevementData();
        break;
      case "Contenant":
        this.filterContenantData();
        break;
    }
  }

  initSectionSelection() {
    if (this.w.data()?.objects?.secteur?.all?.list?.length > 0) {
      for (const sector of this.w.data()?.objects?.secteur?.all?.list) {
        const sectorSelection: SectorSelection = {
          secteur_tag: sector?.item?.tag,
          secteur_uuid: sector?.item?.secteur_uuid,
          selected: true
        };
        this.w.data().projectStats.selectedSector.push(sectorSelection);
      }
    }
  }

  filterFaitData() {
    if (this.w.data()?.objects?.fait?.all?.list?.length > 0) {
      /* Get fait by sector selected */
      const selectedUuidString = this.w.data().projectStats.selectedSector.filter(item => item.selected).map(item => item.secteur_uuid);
      const faitFilteredBySectorSelected = this.w.data().objects.fait.all.list.filter(item => selectedUuidString.includes(item.item.secteur_uuid));
      /* Create histogramme data */
      const propertyCounted = this.countByProperty(faitFilteredBySectorSelected, 'fait_identification_uuid', 'type');
      this.w.data().projectStats.histogrammeData = [];
      if (propertyCounted?.length > 0) {
        for (const element of propertyCounted) {
          if (element.propertyName) {
            this.w.data().projectStats.histogrammeData.push({name: element.propertyName, value: element.count});
          }
        }
      }
      /* Create pie charts data */
      const faitStat = this.countByProperty(faitFilteredBySectorSelected, 'fait_stat_uuid', 'type');
      this.w.data().projectStats.pieStatsData = [];
      if (faitStat?.length > 0) {
        for (const element of faitStat) {
          if (element.propertyName) {
            this.w.data().projectStats.pieStatsData.push({
              name: element.propertyName,
              value: (element.count / faitFilteredBySectorSelected.length * 100)
            });
          }
        }
      }
      /* Create pie methods data */
      let countMechanicalManu = 0;
      let countMechanical = 0;
      let countManual = 0;
      let countNone = 0;
      /* Count methode */
      for (const element of faitFilteredBySectorSelected) {
        if (element?.item?.fait_methode_mechanical && element?.item?.fait_methode_manual) {
          countMechanicalManu++;
        } else if (element?.item?.fait_methode_mechanical && !element?.item?.fait_methode_manual) {
          countMechanical++;
        } else if (!element?.item?.fait_methode_mechanical && element?.item?.fait_methode_manual) {
          countManual++;
        } else {
          countNone++;
        }
      }
      this.w.data().projectStats.pieMethodeTypeData = [];
      this.w.data().projectStats.pieMethodeTypeData.push({
        name: 'Manuel Mécanique',
        value: (countMechanicalManu / faitFilteredBySectorSelected.length * 100)
      });
      this.w.data().projectStats.pieMethodeTypeData.push({
        name: 'Manuel',
        value: (countManual / faitFilteredBySectorSelected.length * 100)
      });
      this.w.data().projectStats.pieMethodeTypeData.push({
        name: 'Mécanique',
        value: (countMechanical / faitFilteredBySectorSelected.length * 100)
      });
      this.w.data().projectStats.pieMethodeTypeData.push({
        name: 'Vide',
        value: (countNone / faitFilteredBySectorSelected.length * 100)
      });
    }
  }

  filterUsData() {
    if (this.w.data()?.objects?.us?.all?.list?.length > 0) {
      /* Get us by sector selected */
      const selectedUuidString = this.w.data().projectStats.selectedSector.filter(item => item.selected).map(item => item.secteur_uuid);
      const usFilteredBySectorSelected = this.w.data().objects.us.all.list.filter(item => selectedUuidString.includes(item.item.secteur_uuid));
      /* Create histogramme data */
      const propertyCounted = this.countByProperty(usFilteredBySectorSelected, 'us_identification_uuid', 'type');
      this.w.data().projectStats.histogrammeData = [];
      if (propertyCounted?.length > 0) {
        for (const element of propertyCounted) {
          if (element.propertyName) {
            this.w.data().projectStats.histogrammeData.push({name: element.propertyName, value: element.count});
          }
        }
      }
      /* Create pie charts data */
      const usStat = this.countByProperty(usFilteredBySectorSelected, 'us_stat', 'type');
      this.w.data().projectStats.pieStatsData = [];
      if (usStat?.length > 0) {
        for (const element of usStat) {
          if (element.propertyName) {
            this.w.data().projectStats.pieStatsData.push({
              name: element.propertyName,
              value: (element.count / usFilteredBySectorSelected.length * 100)
            });
          }
        }
      }
      /* Create pie methods data */
      let countMechanicalManu = 0;
      let countMechanical = 0;
      let countManual = 0;
      let countNone = 0;
      /* Count methode */
      for (const element of usFilteredBySectorSelected) {
        if (element?.item?.us_methode_mechanical && element?.item?.us_methode_manual) {
          countMechanicalManu++;
        } else if (element?.item?.us_methode_mechanical && !element?.item?.us_methode_manual) {
          countMechanical++;
        } else if (!element?.item?.us_methode_mechanical && element?.item?.us_methode_manual) {
          countManual++;
        } else {
          countNone++;
        }
      }
      this.w.data().projectStats.pieMethodeTypeData = [];
      this.w.data().projectStats.pieMethodeTypeData.push({
        name: 'Manuel Mécanique',
        value: (countMechanicalManu / usFilteredBySectorSelected.length * 100)
      });
      this.w.data().projectStats.pieMethodeTypeData.push({
        name: 'Manuel',
        value: (countManual / usFilteredBySectorSelected.length * 100)
      });
      this.w.data().projectStats.pieMethodeTypeData.push({
        name: 'Mécanique',
        value: (countMechanical / usFilteredBySectorSelected.length * 100)
      });
      this.w.data().projectStats.pieMethodeTypeData.push({
        name: 'Vide',
        value: (countNone / usFilteredBySectorSelected.length * 100)
      });
    }
  }

  filterMobilierData() {
    if (this.w.data().objects.echantillon?.all?.list?.length > 0) {
      const mobilierArray = this.w.data().objects.echantillon.all.list.filter(item => item.item.table === ApiDbTable.echantillon_mobilier) as Array<dbBoundObject<ApiEchantillonMobilier>>;
      if (mobilierArray.length > 0) {
        /* Create histogramme data */
        const propertyCounted = this.countByProperty(mobilierArray, 'type_materiaux_uuid', 'type');
        this.w.data().projectStats.histogrammeData = [];
        if (propertyCounted?.length > 0) {
          for (const element of propertyCounted) {
            if (element.propertyName) {
              this.w.data().projectStats.histogrammeData.push({name: element.propertyName, value: element.count});
            }
          }
        }
        /* Create pie charts data */
        const mobilierStat = this.countByProperty(mobilierArray, 'mobilier_etat_uuid', 'type');
        this.w.data().projectStats.pieStatsData = [];
        if (mobilierStat?.length > 0) {
          for (const element of mobilierStat) {
            if (element.propertyName) {
              this.w.data().projectStats.pieStatsData.push({
                name: element.propertyName,
                value: (element.count / mobilierArray.length * 100)
              });
            }
          }
        }
        /* Create pie methods/type data */
        const mobilierType = this.countByProperty(mobilierArray, 'mobilier_type_uuid', 'type');
        this.w.data().projectStats.pieMethodeTypeData = [];
        if (mobilierType?.length > 0) {
          for (const element of mobilierType) {
            if (element.propertyName) {
              this.w.data().projectStats.pieMethodeTypeData.push({
                name: element.propertyName,
                value: (element.count / mobilierArray.length * 100)
              });
            }
          }
        }
      }
    }
  }

  filterPrelevementData() {
    if (this.w.data().objects.echantillon?.all?.list?.length > 0) {
      const prelevementArray = this.w.data().objects.echantillon.all.list.filter(item => item.item.table === ApiDbTable.echantillon_prelevement) as Array<dbBoundObject<ApiEchantillonPrelevement>>;

      if (prelevementArray?.length > 0) {
        /* Create histogramme data */
        const propertyCounted = this.countByProperty(prelevementArray, 'type_nature_uuid', 'type');
        this.w.data().projectStats.histogrammeData = [];
        if (propertyCounted?.length > 0) {
          for (const element of propertyCounted) {
            if (element.propertyName) {
              this.w.data().projectStats.histogrammeData.push({name: element.propertyName, value: element.count});
            }
          }
        }
        /* Create pie charts data */
        const prelementStat = this.countByProperty(prelevementArray, 'prelevement_etat', 'type');
        this.w.data().projectStats.pieStatsData = [];
        if (prelementStat?.length > 0) {
          for (const element of prelementStat) {
            if (element.propertyName) {
              this.w.data().projectStats.pieStatsData.push({
                name: element.propertyName,
                value: (element.count / prelementStat.length * 100)
              });
            }
          }
        }
        this.w.data().projectStats.pieMethodeTypeData = [];

      }

    }
  }

  filterContenantData() {
    if (this.w.data().objects?.contenant?.all?.list?.length > 0) {
      /* Get contenant by sector selected */
      const selectedUuidString = this.w.data().projectStats.selectedSector.filter(item => item.selected).map(item => item.secteur_uuid);
      const contenantList = this.w.data().objects.contenant.all.list;

      /* Create histogramme data */
      this.w.data().projectStats.histogrammeData = [];
      if (contenantList?.length > 0) {
        let nbMobiliersContenant: number = 0;
        let nbPrelevementContenant: number = 0;
        contenantList.map(item => item?.item).forEach(element => {
          nbMobiliersContenant += this.utiles.getAllMobilierContenant(element.contenant_uuid)?.length ?? 0;
          nbPrelevementContenant += this.utiles.getAllPrelevementContenant(element.contenant_uuid)?.length ?? 0;
        });
        this.w.data().projectStats.histogrammeData.push({name: 'Mobiliers', value: nbMobiliersContenant},
          {name: 'Prelevements', value: nbPrelevementContenant});
      }
      /* No pie charts with this filter */
      this.w.data().projectStats.pieMethodeTypeData = [];
      this.w.data().projectStats.pieStatsData = [];
    }
  }

  calcValidationProgression() {

    let maxTotal: number = 0;
    let faitValidCount: number = 0;
    let usValidCount: number = 0;
    if (this.w.data().objects?.fait?.all?.list?.length > 0) {
      faitValidCount = this.w.data().objects.fait.all.list.filter(item => item.item.fait_validation).length;
      LOG.debug.log({...CONTEXT, action: 'calcValidationProgression fait valid count'}, faitValidCount);
      maxTotal += this.w.data().objects.fait.all.list.length;
    }
    if (this.w.data().objects?.us?.all?.list?.length > 0) {
      usValidCount = this.w.data().objects.us.all.list.filter(item => item.item.us_validation).length;
      LOG.debug.log({...CONTEXT, action: 'calcValidationProgression us valid count'}, usValidCount);
      maxTotal += this.w.data().objects.us.all.list.length;
    }

    if (!maxTotal) {
      this.w.data().projectStats.sheetsValidationProgress = 0;
    } else {
      this.w.data().projectStats.sheetsValidationProgress = Math.round(100 / maxTotal * (faitValidCount + usValidCount));
    }

  }

  calcSheetProgress() {
    let percentFait = 0;
    let percentTotalUs = 0;
    let divider = 0;

    if (this.w.data()?.objects?.us?.all?.list?.length > 0) {
      const apiUsArray = this.w.data().objects.us.all.list.map(item => item.item);
      const maxUs = apiUsArray?.length;
      apiUsArray.forEach(item => {
        let usProgress: number = 0;
        let percentUs: number = 0;
        let requiredUsField = ['us_description', 'us_z_inf', 'us_z_sup'];
        // Us positive case
        if (item.table === ApiDbTable.us_positive) {
          requiredUsField.push('positive_nature1', 'positive_inclusions_type_1',
            'positive_durete', 'positive_homogeneite', 'positive_couleur', 'positive_charbons');
        }
        // +1 for methode bool case ans +1 for strati
        let max: number = (requiredUsField.length + 2);
        requiredUsField.forEach(field => {
          if (item[field]) {
            usProgress++;
          }
        });
        // Check methode bool
        if (item['us_methode_manual'] || item['us_methode_mechanical']) {
          usProgress++;
        }
        const usStartigraphie = this.utiles.getStratigraphie(item.us_uuid);
        if (usStartigraphie.anterieur?.length > 0 && usStartigraphie?.posterieur?.length > 0) {
          usProgress++;
        }
        percentUs = 100 / max * usProgress;
        percentTotalUs += percentUs;
      });
      // Calc progress us total
      percentTotalUs = percentTotalUs / maxUs;
      divider++;
      LOG.debug.log({...CONTEXT, action: 'calcSheetProgress progress us'}, percentTotalUs);
    }
    // Calc Fait Progress
    const requiredFaitField = ['fait_description', 'fait_z_sup', 'fait_z_inf'];
    if (this.w.data()?.objects?.fait?.all?.list?.length > 0) {
      const apiFaitArray = this.w.data().objects.fait.all.list.map(item => item.item);
      // +1 for methode bool case
      let max: number = (requiredFaitField.length + 1) * apiFaitArray.length;
      let progress: number = 0;

      apiFaitArray.forEach(item => {
        requiredFaitField.forEach(field => {
          if (item[field]) {
            progress++;
          }
        });
        /* Check methode bool */
        if (item['fait_methode_manual'] || item['fait_methode_mechanical']) {
          progress++;
        }
      });
      percentFait = 100 / max * progress;
      LOG.debug.log({...CONTEXT, action: 'calcSheetProgress progress fait'}, percentFait);
      divider++;
    }
    if (divider) {
      this.w.data().projectStats.sheetsProgress = Math.round((percentTotalUs + percentFait) / divider);
    }
    LOG.debug.log({...CONTEXT, action: 'calcSheetProgress Progress total '}, this.w.data().projectStats.sheetsProgress);
  }

  calcSearchProgress() {
    let averageUsSearchPercent: number = 0;
    let averageFaitSearchPercent: number = 0;
    let divider: number = 0;
    // Calc us search progress
    const apiUs = this.w.data().objects.us.all?.list?.map(item => item.item)
      ?.filter(us => us.us_stat !== ExcavationStatus.CANCELED && us.us_stat !== ExcavationStatus.PHOTOGRAPHED);
    let maxUs = apiUs?.length;
    if (maxUs) {
      /* CALC SEARCH AVERAGE PERCENT OF ALL API US EXCEPT CANCELED AND PHOTOGRAPHED */
      apiUs.forEach(item => {
        switch (item.us_stat) {
          case ExcavationStatus.UNEXCAVATED:
            averageUsSearchPercent += 0;
            break;
          case ExcavationStatus.SONDAGE:
            averageUsSearchPercent += 20;
            break;
          case ExcavationStatus.FIFTY_PERCENT:
            averageUsSearchPercent += 50;
            break;
          case ExcavationStatus.HUNDRED_PERCENT:
            averageUsSearchPercent += 100;
            break;
        }
      });
      averageUsSearchPercent = averageUsSearchPercent / maxUs;
      divider++;
      LOG.debug.log({...CONTEXT, action: 'calcSearchProgress average search us percent'}, averageUsSearchPercent);
    }
    // Calc fait search progress
    const apiFait = this.w.data().objects.fait.all?.list?.map(item => item.item)
      ?.filter(fait => fait.fait_stat_uuid !== ExcavationStatus.CANCELED && fait.fait_stat_uuid !== ExcavationStatus.PHOTOGRAPHED);
    let maxFait = apiFait?.length;
    if (maxFait) {
      /* CALC SEARCH AVERAGE PERCENT OF ALL API FAIT EXCEPT CANCELD AND PHOTOGRAPHED */
      apiFait.forEach(item => {
        switch (item.fait_stat_uuid) {
          case ExcavationStatus.UNEXCAVATED:
            averageFaitSearchPercent += 0;
            break;
          case ExcavationStatus.SONDAGE:
            averageFaitSearchPercent += 20;
            break;
          case ExcavationStatus.FIFTY_PERCENT:
            averageFaitSearchPercent += 50;
            break;
          case ExcavationStatus.HUNDRED_PERCENT:
            averageFaitSearchPercent += 100;
            break;
        }
      });
      averageFaitSearchPercent = averageFaitSearchPercent / maxFait;
      divider++;
      LOG.debug.log({...CONTEXT, action: 'calcSearchProgress average search fait percent'}, averageFaitSearchPercent);
    }
    if (divider) {
      this.w.data().projectStats.searchProgress = Math.round((averageFaitSearchPercent + averageUsSearchPercent) / divider);
    }
  }

  countByProperty(arrayObject: Array<dbBoundObject<ApiSyncableObject>>, property: string, dataType: 'string' | 'type' = 'string'): Array<{ propertyName: string, count: number }> {
    const arraySyncable: Array<ApiSyncableObject> = [];
    for (const object of arrayObject) {
      arraySyncable.push(object.item);
    }
    let propertyCounted: Array<{ propertyName: string, count: number }>;
    propertyCounted = Object.values(arraySyncable.reduce((object, item) => {
      /* Get property + transform type uuid to type label */
      object[item[property]] = object[item[property]] || {
        propertyName: dataType === 'type'
          ? this.getTypeLabel(item[property])
          : item[property],
        count: 0
      };
      object[item[property]].count++;
      return object;
    }, {}));
    return propertyCounted;
  }

  resetData() {
    this.w.data().projectStats.setDefault();
  }

  getTypeLabel(typeUuid: string): string {
    return this.w.data().types.list.find(type => type?.type_uuid === typeUuid)?.type_label;
  }

}
