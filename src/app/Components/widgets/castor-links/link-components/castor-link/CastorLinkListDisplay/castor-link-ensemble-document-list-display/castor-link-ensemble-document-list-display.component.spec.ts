import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkEnsembleDocumentListDisplayComponent } from './castor-link-ensemble-document-list-display.component';

describe('CastorLinkEnsembleDocumentListDisplayComponent', () => {
  let component: CastorLinkEnsembleDocumentListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkEnsembleDocumentListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkEnsembleDocumentListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkEnsembleDocumentListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
