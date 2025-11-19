import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkSectionTableDisplayComponent } from './castor-link-section-table-display.component';

describe('CastorLinkSectionTableDisplayComponent', () => {
  let component: CastorLinkSectionTableDisplayComponent;
  let fixture: ComponentFixture<CastorLinkSectionTableDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkSectionTableDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkSectionTableDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
