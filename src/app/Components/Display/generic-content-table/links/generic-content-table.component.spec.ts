import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericContentTableComponent } from './generic-content-table.component';

describe('GenericContentTableComponent', () => {
  let component: GenericContentTableComponent;
  let fixture: ComponentFixture<GenericContentTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GenericContentTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GenericContentTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
