import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkTopoDocumentListDisplayComponent } from './castor-link-topo-document-list-display.component';

describe('CastorLinkTopoDocumentListDisplayComponent', () => {
  let component: CastorLinkTopoDocumentListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkTopoDocumentListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkTopoDocumentListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkTopoDocumentListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
