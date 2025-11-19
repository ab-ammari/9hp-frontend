import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorProjectUserSelectionComponent } from './castor-project-user-selection.component';

describe('CastorProjectUserSelectionComponent', () => {
  let component: CastorProjectUserSelectionComponent;
  let fixture: ComponentFixture<CastorProjectUserSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorProjectUserSelectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorProjectUserSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
