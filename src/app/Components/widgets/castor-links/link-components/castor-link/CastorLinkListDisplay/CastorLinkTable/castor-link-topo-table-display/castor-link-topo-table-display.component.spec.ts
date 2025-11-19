import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkTopoTableDisplayComponent } from './castor-link-topo-table-display.component';

describe('CastorLinkTopoTableDisplayComponent', () => {
  let component: CastorLinkTopoTableDisplayComponent;
  let fixture: ComponentFixture<CastorLinkTopoTableDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkTopoTableDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkTopoTableDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
