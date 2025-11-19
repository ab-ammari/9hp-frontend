import {Component, OnInit, OnDestroy} from '@angular/core';
import {WorkerService} from "../../services/worker.service";
import {LOG, LoggerContext} from "ngx-wcore";
import { Router, ActivatedRoute, NavigationEnd, Event } from "@angular/router";
import { filter, takeUntil, map } from "rxjs/operators";
import { Subject } from "rxjs";
import { TabItem } from "../../Components/Display/headband-tabs-nav/headband-tabs-nav.component";


const CONTEXT: LoggerContext = {
  origin: 'DashboardComponent'
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  dashboardTabs: TabItem[] = [
    { id: 'statistics', label: 'Statistiques', path: 'statistics' },
    { id: 'stratigraphic-test', label: 'Test stratigraphique', path: 'stratigraphic-test' },
    { id: 'stratigraphic-diagram', label: 'Diagramme stratigraphique', path: 'stratigraphic-diagram' }
  ];

  isOnDashboardPage: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    public w: WorkerService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    // Surveiller les événements de navigation pour mettre à jour isOnDashboardPage
    this.router.events.pipe(
      takeUntil(this.destroy$),
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event: NavigationEnd) => {
        // Vérifier si l'URL contient l'un des chemins du tableau de bord
        const url = event.urlAfterRedirects || event.url;
        const isDashboardPage = this.dashboardTabs.some(tab => url.includes('/' + tab.path));
        return isDashboardPage;
      })
    ).subscribe((isDashboardPage: boolean) => {
      this.isOnDashboardPage = isDashboardPage;
      LOG.debug.log({...CONTEXT, action: 'routeChange'}, 'Is on dashboard:', this.isOnDashboardPage);
    });
  }

  ngOnInit(): void {
    LOG.debug.log({...CONTEXT, action: 'ngOnInit'}, this.w.db());

    const currentUrl = this.router.url;
    this.isOnDashboardPage = this.dashboardTabs.some(tab => currentUrl.includes('/' + tab.path));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
