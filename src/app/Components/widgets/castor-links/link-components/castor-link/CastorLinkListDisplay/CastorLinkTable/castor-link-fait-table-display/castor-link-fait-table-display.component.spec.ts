import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkFaitTableDisplayComponent } from './castor-link-fait-table-display.component';

describe('CastorLinkFaitTableDisplayComponent', () => {
  let component: CastorLinkFaitTableDisplayComponent;
  let fixture: ComponentFixture<CastorLinkFaitTableDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkFaitTableDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkFaitTableDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
