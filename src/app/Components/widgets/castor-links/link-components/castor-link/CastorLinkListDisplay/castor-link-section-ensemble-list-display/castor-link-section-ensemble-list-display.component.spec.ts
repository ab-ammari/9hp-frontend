import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkSectionEnsembleListDisplayComponent } from './castor-link-section-ensemble-list-display.component';

describe('CastorLinkSectionEnsembleListDisplayComponent', () => {
  let component: CastorLinkSectionEnsembleListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkSectionEnsembleListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkSectionEnsembleListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkSectionEnsembleListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
