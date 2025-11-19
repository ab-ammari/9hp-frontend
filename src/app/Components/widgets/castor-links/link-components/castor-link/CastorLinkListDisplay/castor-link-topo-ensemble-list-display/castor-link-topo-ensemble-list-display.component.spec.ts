import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkTopoEnsembleListDisplayComponent } from './castor-link-topo-ensemble-list-display.component';

describe('CastorLinkTopoEnsembleListDisplayComponent', () => {
  let component: CastorLinkTopoEnsembleListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkTopoEnsembleListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkTopoEnsembleListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkTopoEnsembleListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
