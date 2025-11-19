import {Component, OnDestroy, OnInit} from '@angular/core';
import {Color, LegendPosition} from "@swimlane/ngx-charts";
import {WorkerService} from "../../services/worker.service";
import {A} from "../../Core-event";
import {Subject, timer} from "rxjs";
import {SectorSelection} from "../../DataClasses/project-stats.dataclass";
import {debounce, takeUntil, tap} from "rxjs/operators";

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit, OnDestroy {
  private subscriber$ = new Subject();
  /* GRAPHICS STUFF */
  // options for bar
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = true;
  showYAxisLabel = true;

  // options for pie chart
  showLabels: boolean = true;
  isDoughnut: boolean = false;
  legendPosition: LegendPosition = LegendPosition.Below;

  colorScheme: Color = {
    group: null,
    name: "color",
    selectable: false,
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };
  /* Other */
  arraySelectionDisplayFilter: Array<'Faits' | 'US' | 'Mobilier' | 'Prélevements' | 'Contenant'> = ['Faits', 'US', 'Mobilier', 'Prélevements', 'Contenant'];
  selectedSector: Array<SectorSelection>;

  constructor(public w: WorkerService) {
  }

  ngOnDestroy(): void {
    this.subscriber$.next(undefined);
  }

  ngOnInit(): void {

    if (this.w.data().objects.isInit) {
      this.initStats();
    }

    this.w.data().objects.onInit.pipe(takeUntil(this.subscriber$), tap(() => {
      console.log('object all init, init stats', this.w.data().objects.us.all.list);
      this.initStats();
    })).subscribe();

    this.w.data().objects.onObjectsChange.pipe(takeUntil(this.subscriber$),
      debounce(() => timer(1000)),
      tap(() => {
      this.initStats();
    })).subscribe();

  }

  initStats() {
    this.w.trigger(A.initStats);
    this.getSelectedSector();
  }

  getSelectedSector() {
    this.selectedSector = this.w.data().projectStats.selectedSector.filter(item => item.selected);
  }

  onSelect(event) {
    console.log(event);
  }

  clickFilter(filter: 'Faits' | 'US' | 'Mobilier' | 'Prélevements' | 'Contenant') {
    this.w.data().projectStats.selectedDisplayFilter = filter;
    this.w.trigger(A.updateData);
  }

  sectorSelectionChange(event: Event) {
    this.w.trigger(A.updateData);
    this.getSelectedSector();
  }

  unselectAllSectorFilter() {
    if (this.w.data().projectStats?.selectedSector?.length > 0) {
      for (const sectorSelection of this.w.data().projectStats.selectedSector) {
        sectorSelection.selected = false;
      }
    }
    this.getSelectedSector();
    this.w.trigger(A.updateData);
  }

  resetDisplayFilter() {
    this.w.data().projectStats.selectedDisplayFilter = 'Faits';
    this.w.trigger(A.updateData);
  }

  isContenantDisplayFilter(): boolean {
    return this.w.data().projectStats.selectedDisplayFilter === "Contenant";
  }

}
