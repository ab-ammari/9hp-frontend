import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkEnsembleUsListDisplayComponent } from './castor-link-ensemble-us-list-display.component';

describe('CastorLinkEnsembleUsListDisplayComponent', () => {
  let component: CastorLinkEnsembleUsListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkEnsembleUsListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkEnsembleUsListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkEnsembleUsListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
