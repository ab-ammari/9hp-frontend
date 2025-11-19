import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkSectionFaitListDisplayComponent } from './castor-link-section-fait-list-display.component';

describe('CastorLinkSectionFaitListDisplayComponent', () => {
  let component: CastorLinkSectionFaitListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkSectionFaitListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkSectionFaitListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkSectionFaitListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
