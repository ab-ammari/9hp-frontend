import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkContenantTableDisplayComponent } from './castor-link-contenant-table-display.component';

describe('CastorLinkContenantTableDisplayComponent', () => {
  let component: CastorLinkContenantTableDisplayComponent;
  let fixture: ComponentFixture<CastorLinkContenantTableDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkContenantTableDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkContenantTableDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
