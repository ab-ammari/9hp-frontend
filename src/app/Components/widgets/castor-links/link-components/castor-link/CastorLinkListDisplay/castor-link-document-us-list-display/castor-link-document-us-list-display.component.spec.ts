import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkDocumentUsListDisplayComponent } from './castor-link-document-us-list-display.component';

describe('CastorLinkDocumentUsListDisplayComponent', () => {
  let component: CastorLinkDocumentUsListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkDocumentUsListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkDocumentUsListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkDocumentUsListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
