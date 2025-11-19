import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkTopoUsListDisplayComponent } from './castor-link-topo-us-list-display.component';

describe('CastorLinkTopoUsListDisplayComponent', () => {
  let component: CastorLinkTopoUsListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkTopoUsListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkTopoUsListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkTopoUsListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
