import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkSectionUsListDisplayComponent } from './castor-link-section-us-list-display.component';

describe('CastorLinkSectionUsListDisplayComponent', () => {
  let component: CastorLinkSectionUsListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkSectionUsListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkSectionUsListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkSectionUsListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
