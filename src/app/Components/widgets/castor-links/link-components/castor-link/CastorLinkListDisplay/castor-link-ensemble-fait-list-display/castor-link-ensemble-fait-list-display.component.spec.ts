import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkEnsembleFaitListDisplayComponent } from './castor-link-ensemble-fait-list-display.component';

describe('CastorLinkEnsembleFaitListDisplayComponent', () => {
  let component: CastorLinkEnsembleFaitListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkEnsembleFaitListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkEnsembleFaitListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkEnsembleFaitListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
