import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorRowItemEnsembleComponent } from './castor-row-item-ensemble.component';

describe('CastorRowItemEnsembleComponent', () => {
  let component: CastorRowItemEnsembleComponent;
  let fixture: ComponentFixture<CastorRowItemEnsembleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorRowItemEnsembleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorRowItemEnsembleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
