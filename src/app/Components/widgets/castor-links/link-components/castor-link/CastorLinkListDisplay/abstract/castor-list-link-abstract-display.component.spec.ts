import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ApiDbTable} from '../../../../../../../../../shared';
import {CastorListLinkAbstractDisplayComponent} from './castor-list-link-abstract-display.component';
import {LinkList} from '../../../../../../../services/castor-object-context.service';

@Component({
  selector: 'app-castor-list-link-display-concrete',
  template: '<div></div>'
})
class CastorListLinkDisplayConcreteComponent extends CastorListLinkAbstractDisplayComponent {
  public initCount = 0;

  init(): void {
    this.initCount++;
  }
}

const createStubList = (): LinkList => ({
  list: [],
  relation: {ref_table: ApiDbTable.us} as any,
  reference: {ref_table: ApiDbTable.us} as any,
  target: {ref_table: ApiDbTable.us} as any
});

describe('CastorListLinkAbstractDisplayComponent (abstract)', () => {
  let component: CastorListLinkDisplayConcreteComponent;
  let fixture: ComponentFixture<CastorListLinkDisplayConcreteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CastorListLinkDisplayConcreteComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CastorListLinkDisplayConcreteComponent);
    component = fixture.componentInstance;
    component.list = createStubList();
    fixture.detectChanges();
  });

  it('appelle init lors du cycle de vie Angular', () => {
    expect(component).toBeTruthy();
    expect(component.initCount).toBeGreaterThan(0);
  });
});
