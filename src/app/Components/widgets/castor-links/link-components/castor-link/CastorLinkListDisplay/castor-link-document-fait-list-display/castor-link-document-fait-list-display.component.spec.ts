import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkDocumentFaitListDisplayComponent } from './castor-link-document-fait-list-display.component';

describe('CastorLinkDocumentFaitListDisplayComponent', () => {
  let component: CastorLinkDocumentFaitListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkDocumentFaitListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkDocumentFaitListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkDocumentFaitListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
