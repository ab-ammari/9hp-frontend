import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkUsTableDisplayComponent } from './castor-link-us-table-display.component';

describe('CastorLinkUsTableDisplayComponent', () => {
  let component: CastorLinkUsTableDisplayComponent;
  let fixture: ComponentFixture<CastorLinkUsTableDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkUsTableDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkUsTableDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
