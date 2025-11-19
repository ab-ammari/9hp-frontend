import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericContentObjectTableComponent } from './generic-content-object-table.component';

describe('GenericContentObjectTableComponent', () => {
  let component: GenericContentObjectTableComponent;
  let fixture: ComponentFixture<GenericContentObjectTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GenericContentObjectTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GenericContentObjectTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
