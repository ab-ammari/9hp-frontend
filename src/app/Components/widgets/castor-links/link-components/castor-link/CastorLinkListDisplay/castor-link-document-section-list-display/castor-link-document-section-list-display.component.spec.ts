import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkDocumentSectionListDisplayComponent } from './castor-link-document-section-list-display.component';

describe('CastorLinkDocumentSectionListDisplayComponent', () => {
  let component: CastorLinkDocumentSectionListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkDocumentSectionListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkDocumentSectionListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkDocumentSectionListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
