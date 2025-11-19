import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { LOG, LoggerContext } from 'ngx-wcore';

const CONTEXT: LoggerContext = {
  origin: 'HeadbandTabsNavComponent'
}

export interface TabItem {
  id: string;
  label: string;
  path: string;
}

@Component({
  selector: 'app-headband-tabs-nav',
  templateUrl: './headband-tabs-nav.component.html',
  styleUrls: ['./headband-tabs-nav.component.scss']
})
export class HeadbandTabsNavComponent implements OnInit, OnDestroy {
  @Input() tabs: TabItem[] = [];
  @Input() baseRoute: string = '/home/project-dashboard';

  currentTabId: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Initialiser l'onglet actif en fonction de l'URL actuelle
    this.updateActiveTab(this.router.url);

    // Écouter les changements de route pour mettre à jour l'onglet actif
    this.router.events.pipe(
      takeUntil(this.destroy$),
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateActiveTab(event.urlAfterRedirects || event.url);
    });

    LOG.debug.log({...CONTEXT, action: 'ngOnInit'}, 'Tabs:', this.tabs);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToTab(tab: TabItem): void {
    this.currentTabId = tab.id;
    this.router.navigate([this.baseRoute + '/' + tab.path]);

    LOG.debug.log({...CONTEXT, action: 'navigateToTab'}, 'Navigated to tab:', tab);
  }

  private updateActiveTab(url: string): void {
    // Trouver l'onglet correspondant à l'URL actuelle
    const activeTab = this.tabs.find(tab => url.includes('/' + tab.path));

    if (activeTab) {
      this.currentTabId = activeTab.id;
      LOG.debug.log({...CONTEXT, action: 'updateActiveTab'}, 'Current tab:', this.currentTabId);
    }
  }
}
