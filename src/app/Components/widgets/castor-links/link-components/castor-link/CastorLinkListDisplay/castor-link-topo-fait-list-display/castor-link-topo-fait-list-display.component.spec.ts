import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkTopoFaitListDisplayComponent } from './castor-link-topo-fait-list-display.component';

describe('CastorLinkTopoFaitListDisplayComponent', () => {
  let component: CastorLinkTopoFaitListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkTopoFaitListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkTopoFaitListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkTopoFaitListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
