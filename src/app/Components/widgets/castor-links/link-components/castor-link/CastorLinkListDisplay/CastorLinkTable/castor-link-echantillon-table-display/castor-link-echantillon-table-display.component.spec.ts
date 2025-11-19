import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkEchantillonTableDisplayComponent } from './castor-link-echantillon-table-display.component';

describe('CastorLinkEchantillonTableDisplayComponent', () => {
  let component: CastorLinkEchantillonTableDisplayComponent;
  let fixture: ComponentFixture<CastorLinkEchantillonTableDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkEchantillonTableDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkEchantillonTableDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
