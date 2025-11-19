import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkDocumentTableDisplayComponent } from './castor-link-document-table-display.component';

describe('CastorLinkDocumentTableDisplayComponent', () => {
  let component: CastorLinkDocumentTableDisplayComponent;
  let fixture: ComponentFixture<CastorLinkDocumentTableDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkDocumentTableDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkDocumentTableDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
