import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiDbTable, ApiStratigraphie } from '../../../../../shared';
import { WorkerService } from '../../../services/worker.service';
import { CastorAuthorizationService } from '../../../services/castor-authorization-service.service';
import { ConfirmationService } from '../../../services/confirmation.service';

export type DataPanelTab = 'search' | 'isolated' | 'relations' | 'stats';

export interface DiagramNode {
  id: string;
  label: string;
  type: 'us' | 'fait';
  uuid: string;
}

export interface IsolatedEntity {
  uuid: string;
  label: string;
  type: 'us' | 'fait';
  childrenUS?: IsolatedEntity[];
}

export interface RelationDisplay {
  relation: ApiStratigraphie;
  leftLabel: string;
  leftType: 'us' | 'fait';
  rightLabel: string;
  rightType: 'us' | 'fait';
  type: string;
}

export interface DiagramStats {
  totalNodes: number;
  totalEdges: number;
  usCount: number;
  faitCount: number;
  isolatedCount: number;
}

@Component({
  selector: 'app-data-panel',
  templateUrl: './data-panel.component.html',
  styleUrls: ['./data-panel.component.scss']
})
export class DataPanelComponent implements OnInit, OnDestroy {

  @Input() isOpen: boolean = false;
  @Input() allNodes: DiagramNode[] = [];
  @Input() stats: DiagramStats = {
    totalNodes: 0,
    totalEdges: 0,
    usCount: 0,
    faitCount: 0,
    isolatedCount: 0
  };

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();
  @Output() entityZoom = new EventEmitter<DiagramNode>();
  @Output() relationDeleted = new EventEmitter<RelationDisplay>();
  @Output() diagramRegenerate = new EventEmitter<void>();

  // Onglet actif
  activeTab: DataPanelTab = 'search';

  // Onglets disponibles
  tabs: { id: DataPanelTab; label: string; icon: string }[] = [
    { id: 'search', label: 'Recherche', icon: 'search-outline' },
    { id: 'isolated', label: 'Isolées', icon: 'file-tray-outline' },
    { id: 'relations', label: 'Relations', icon: 'link-outline' },
    { id: 'stats', label: 'Stats', icon: 'stats-chart-outline' }
  ];

  // === Recherche ===
  searchQuery = '';
  searchResults: DiagramNode[] = [];

  // === Entités isolées ===
  isolatedFilters = { showFaits: true, showUS: true };
  isolatedEntities: IsolatedEntity[] = [];
  filteredIsolatedEntities: IsolatedEntity[] = [];
  expandedFaits = new Set<string>();
  isolatedSearchQuery = '';
  private isolatedEntitiesLoaded = false;
  readonly ISOLATED_ITEM_HEIGHT = 52;

  // === Relations ===
  relationsSearchQuery = '';
  allRelations: RelationDisplay[] = [];
  filteredRelations: RelationDisplay[] = [];
  isDeletingRelation = false;
  private relationsLoaded = false;
  readonly RELATION_ITEM_HEIGHT = 56;

  private destroy$ = new Subject<void>();

  // Exposer ApiDbTable pour le template
  readonly ApiDbTable = ApiDbTable;

  constructor(
    private w: WorkerService,
    private authService: CastorAuthorizationService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.updateSearchResults();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.closed.emit();
  }

  selectTab(tabId: DataPanelTab): void {
    this.activeTab = tabId;

    // Charger les données selon l'onglet
    switch (tabId) {
      case 'isolated':
        if (!this.isolatedEntitiesLoaded) {
          this.updateIsolatedEntities();
        }
        break;
      case 'relations':
        if (!this.relationsLoaded) {
          this.loadRelations();
        }
        break;
    }
  }

  // ==========================================
  // RECHERCHE
  // ==========================================

  onSearchQueryChange(): void {
    this.updateSearchResults();
  }

  private updateSearchResults(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = this.allNodes.slice(0, 20);
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.searchResults = this.allNodes.filter(node =>
      node.label.toLowerCase().includes(query) ||
      node.uuid.toLowerCase().includes(query)
    ).slice(0, 50);
  }

  zoomToEntity(node: DiagramNode): void {
    this.entityZoom.emit(node);
  }

  // ==========================================
  // ENTITÉS ISOLÉES
  // ==========================================

  toggleIsolatedFilter(filterType: 'faits' | 'us'): void {
    if (filterType === 'faits') {
      this.isolatedFilters.showFaits = !this.isolatedFilters.showFaits;
    } else {
      this.isolatedFilters.showUS = !this.isolatedFilters.showUS;
    }
    this.isolatedEntitiesLoaded = false;
    this.updateIsolatedEntities();
  }

  onIsolatedSearchChange(): void {
    this.filterIsolatedEntities();
  }

  toggleFaitExpansion(faitUuid: string): void {
    if (this.expandedFaits.has(faitUuid)) {
      this.expandedFaits.delete(faitUuid);
    } else {
      this.expandedFaits.add(faitUuid);
    }
  }

  trackByIsolatedEntity(index: number, entity: IsolatedEntity): string {
    return entity.uuid;
  }

  trackByChildUS(index: number, child: IsolatedEntity): string {
    return child.uuid;
  }

  updateIsolatedEntities(): void {
    const relations = this.w.data().objects.stratigraphie.all.list
      .map(item => item.item)
      .filter(rel => rel && rel.live !== false);

    const connectedUUIDs = new Set<string>();

    relations.forEach(rel => {
      if (rel.us_anterieur) connectedUUIDs.add(rel.us_anterieur);
      if (rel.us_posterieur) connectedUUIDs.add(rel.us_posterieur);
      if (rel.fait_anterieur) connectedUUIDs.add(rel.fait_anterieur);
      if (rel.fait_posterieur) connectedUUIDs.add(rel.fait_posterieur);
    });

    const isolated: IsolatedEntity[] = [];

    if (this.isolatedFilters.showFaits) {
      this.w.data().objects.fait.all.list.forEach(faitWrapper => {
        const fait = faitWrapper.item;
        if (fait && fait.live !== false && !connectedUUIDs.has(fait.fait_uuid)) {
          const childrenUS: IsolatedEntity[] = [];

          this.w.data().objects.us.all.list.forEach(usWrapper => {
            const us = usWrapper.item;
            if (us && us.live !== false && us.fait_uuid === fait.fait_uuid) {
              if (!connectedUUIDs.has(us.us_uuid)) {
                childrenUS.push({
                  uuid: us.us_uuid,
                  label: us.tag || us.us_uuid.substring(0, 8),
                  type: 'us'
                });
              }
            }
          });

          isolated.push({
            uuid: fait.fait_uuid,
            label: fait.tag || fait.fait_uuid.substring(0, 8),
            type: 'fait',
            childrenUS: childrenUS.length > 0 ? childrenUS : undefined
          });
        }
      });
    }

    if (this.isolatedFilters.showUS) {
      this.w.data().objects.us.all.list.forEach(usWrapper => {
        const us = usWrapper.item;
        if (us && us.live !== false && !connectedUUIDs.has(us.us_uuid)) {
          const isInIsolatedFait = isolated.some(
            entity => entity.type === 'fait' &&
              entity.childrenUS?.some(child => child.uuid === us.us_uuid)
          );

          if (!isInIsolatedFait) {
            isolated.push({
              uuid: us.us_uuid,
              label: us.tag || us.us_uuid.substring(0, 8),
              type: 'us'
            });
          }
        }
      });
    }

    isolated.sort((a, b) => {
      if (a.type === b.type) {
        return a.label.localeCompare(b.label);
      }
      return a.type === 'fait' ? -1 : 1;
    });

    this.isolatedEntities = isolated;
    this.filterIsolatedEntities();
    this.isolatedEntitiesLoaded = true;
  }

  private filterIsolatedEntities(): void {
    if (!this.isolatedSearchQuery.trim()) {
      this.filteredIsolatedEntities = this.isolatedEntities;
      return;
    }

    const query = this.isolatedSearchQuery.toLowerCase().trim();

    this.filteredIsolatedEntities = this.isolatedEntities.filter(entity => {
      const matchesEntity = entity.label.toLowerCase().includes(query) ||
        entity.uuid.toLowerCase().includes(query);

      if (entity.type === 'fait' && entity.childrenUS) {
        const matchesChildren = entity.childrenUS.some(child =>
          child.label.toLowerCase().includes(query) ||
          child.uuid.toLowerCase().includes(query)
        );
        return matchesEntity || matchesChildren;
      }

      return matchesEntity;
    });
  }

  // ==========================================
  // RELATIONS
  // ==========================================

  onRelationsSearchChange(): void {
    this.filterRelations();
  }

  trackByRelationUuid(index: number, item: RelationDisplay): string {
    return item.relation.stratigraphie_uuid || index.toString();
  }

  loadRelations(): void {
    const relations = this.w.data().objects.stratigraphie.all.list
      .map(item => item.item)
      .filter(rel => rel && rel.live !== false);

    this.allRelations = relations.map(rel => ({
      relation: rel,
      leftLabel: '',
      leftType: 'us' as 'us' | 'fait',
      rightLabel: '',
      rightType: 'us' as 'us' | 'fait',
      type: ''
    }));

    this.filteredRelations = [...this.allRelations];
    this.relationsLoaded = true;
  }

  refreshRelations(): void {
    this.relationsLoaded = false;
    this.loadRelations();
  }

  private filterRelations(): void {
    if (!this.relationsSearchQuery.trim()) {
      this.filteredRelations = [...this.allRelations];
      return;
    }

    const query = this.relationsSearchQuery.toLowerCase().trim();
    this.filteredRelations = this.allRelations.filter(rel => {
      const relation = rel.relation;

      const searchInEntity = (uuid: string | null, table: ApiDbTable) => {
        if (!uuid) return false;
        const entity = table === ApiDbTable.us
          ? this.w.data().objects.us.all.findByUuid(uuid)
          : this.w.data().objects.fait.all.findByUuid(uuid);
        const tag = entity?.item?.tag || '';
        return tag.toLowerCase().includes(query) || uuid.toLowerCase().includes(query);
      };

      return searchInEntity(relation.us_anterieur, ApiDbTable.us) ||
        searchInEntity(relation.us_posterieur, ApiDbTable.us) ||
        searchInEntity(relation.fait_anterieur, ApiDbTable.fait) ||
        searchInEntity(relation.fait_posterieur, ApiDbTable.fait);
    });
  }

  canDeleteRelation(relation: ApiStratigraphie): boolean {
    return this.authService.canDeleteRelation(relation);
  }

  deleteRelation(relDisplay: RelationDisplay, event?: Event): void {
    if (this.isDeletingRelation) return;

    if (event) {
      event.stopPropagation();
    }

    const relation = relDisplay.relation;

    if (this.canDeleteRelation(relation)) {
      this.confirmationService.showConfirmDialog(
        'Supprimer la relation',
        `Êtes-vous sûr de vouloir supprimer cette relation ?`,
        () => {
          this.isDeletingRelation = true;
          relation.live = false;

          this.w.data().objects.stratigraphie.selected.commit(relation).subscribe(
            () => {
              setTimeout(() => {
                this.loadRelations();
                this.relationDeleted.emit(relDisplay);
                this.diagramRegenerate.emit();
                this.isDeletingRelation = false;
              }, 100);
            },
            error => {
              console.error('Erreur lors de la suppression de la relation', error);
              this.isDeletingRelation = false;
              this.confirmationService.showConfirmDialog(
                'Erreur',
                'Une erreur est survenue lors de la suppression de la relation.',
                () => {},
                () => {},
                'OK',
                null
              );
            }
          );
        },
        () => {}
      );
    } else {
      this.confirmationService.showInfoDialog(
        'Accès refusé',
        'Seul le propriétaire du projet ou le créateur de cette relation peut la supprimer.'
      );
    }
  }
}