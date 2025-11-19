import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkTopoSectionListDisplayComponent } from './castor-link-topo-section-list-display.component';

describe('CastorLinkTopoSectionListDisplayComponent', () => {
  let component: CastorLinkTopoSectionListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkTopoSectionListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkTopoSectionListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkTopoSectionListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
