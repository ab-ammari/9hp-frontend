import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericContentObjectTableRowComponent } from './generic-content-object-table-row.component';

describe('GenericContentObjectTableRowComponent', () => {
  let component: GenericContentObjectTableRowComponent;
  let fixture: ComponentFixture<GenericContentObjectTableRowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GenericContentObjectTableRowComponent]
    });
    fixture = TestBed.createComponent(GenericContentObjectTableRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
