import {Component, ViewChild} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {IonicModule} from '@ionic/angular';
import {CastorObjectSelectorComponent} from './castor-object-selector.component';
import {ApiDbTable, ApiSyncableObject} from '../../../../../shared';
import {WorkerService} from '../../../services/worker.service';

class WorkerServiceStub {}

@Component({
  template: `<app-castor-object-selector
    [list]="list"
    [filterByObject]="filterByObject"
    [(selection)]="selection"></app-castor-object-selector>`
})
class HostComponent {
  @ViewChild(CastorObjectSelectorComponent)
  selector: CastorObjectSelectorComponent<ApiSyncableObject>;

  list = [{
    item: {
      table: ApiDbTable.us,
      author_uuid: 'author',
      live: true,
      versions: [],
      projet_uuid: 'projet',
      tag_detail: {tag: 'item-1'},
      created: 1
    } as ApiSyncableObject,
    info: {}
  } as any];

  filterByObject = {};
  selection: any = null;
}

describe('CastorObjectSelectorComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let hostComponent: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CastorObjectSelectorComponent, HostComponent],
      imports: [IonicModule.forRoot()],
      providers: [{provide: WorkerService, useClass: WorkerServiceStub}]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initialise et filtre la liste par défaut', () => {
    expect(hostComponent.selector).toBeTruthy();
    expect(hostComponent.selector.filtered_list.length).toBe(1);
  });
});
