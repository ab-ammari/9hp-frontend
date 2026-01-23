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
    {
      id: 'stratigraphie',
      label: 'Stratigraphie',
      path: 'stratigraphie',
      children: [
        { id: 'stratigraphic-test', label: 'Contrôle', path: 'stratigraphic-test' },
        { id: 'stratigraphic-diagram', label: 'Diagramme', path: 'stratigraphic-diagram' }
      ]
    }
  ];



  isOnDashboardPage: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    public w: WorkerService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.router.events.pipe(
      takeUntil(this.destroy$),
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event: NavigationEnd) => {
        const url = event.urlAfterRedirects || event.url;
        return this.isDashboardRoute(url);
      })
    ).subscribe((isDashboardPage: boolean) => {
      this.isOnDashboardPage = isDashboardPage;
      LOG.debug.log({...CONTEXT, action: 'routeChange'}, 'Is on dashboard:', this.isOnDashboardPage);
    });
  }

  ngOnInit(): void {
    LOG.debug.log({...CONTEXT, action: 'ngOnInit'}, this.w.db());

    const currentUrl = this.router.url;
    this.isOnDashboardPage = this.isDashboardRoute(currentUrl);
  }

  private isDashboardRoute(url: string): boolean {
    // Vérifier si l'URL contient l'un des chemins du tableau de bord
    return this.dashboardTabs.some(tab => {
      // Vérifier le tab principal
      if (url.includes('/' + tab.path)) {
        return true;
      }
      // Vérifier les enfants si présents
      if (tab.children) {
        return tab.children.some(child => url.includes('/' + child.path));
      }
      return false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
