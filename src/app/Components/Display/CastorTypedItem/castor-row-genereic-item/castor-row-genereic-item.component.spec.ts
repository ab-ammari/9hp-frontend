import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Subject} from 'rxjs';
import {CastorRowGenereicItemComponent} from './castor-row-genereic-item.component';
import {ApiDbTable, ApiSyncableObject} from '../../../../../../shared';

@Component({
  selector: 'app-castor-row-genereic-item-concrete',
  template: '<div></div>'
})
class CastorRowGenereicItemConcreteComponent extends CastorRowGenereicItemComponent {
  public initCalls: ApiSyncableObject[] = [];

  constructor() {
    super();
  }

  init(object: ApiSyncableObject) {
    this.initCalls.push(object);
  }
}

describe('CastorRowGenereicItemComponent (abstract)', () => {
  let component: CastorRowGenereicItemConcreteComponent;
  let fixture: ComponentFixture<CastorRowGenereicItemConcreteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CastorRowGenereicItemConcreteComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CastorRowGenereicItemConcreteComponent);
    component = fixture.componentInstance;

    const valueChanges = new Subject<ApiSyncableObject>();
    const baseObject: ApiSyncableObject = {
      table: ApiDbTable.us,
      author_uuid: 'author',
      live: true,
      versions: [],
      projet_uuid: 'project'
    } as ApiSyncableObject;

    component.object = {
      item: baseObject,
      onValueChange: () => valueChanges.asObservable()
    } as any;

    fixture.detectChanges();
    valueChanges.next({...baseObject, tag_detail: {tag: 'updated'}} as ApiSyncableObject);
  });

  it('initialise correctement les données de l’objet', () => {
    expect(component).toBeTruthy();
    expect(component.initCalls.length).toBeGreaterThanOrEqual(1);
  });
});
