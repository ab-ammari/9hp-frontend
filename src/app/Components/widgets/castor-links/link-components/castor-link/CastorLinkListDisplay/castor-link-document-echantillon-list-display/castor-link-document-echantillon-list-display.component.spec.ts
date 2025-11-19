import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkDocumentEchantillonListDisplayComponent } from './castor-link-document-echantillon-list-display.component';

describe('CastorLinkDocumentechantillonListDisplayComponent', () => {
  let component: CastorLinkDocumentEchantillonListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkDocumentEchantillonListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkDocumentEchantillonListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkDocumentEchantillonListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
