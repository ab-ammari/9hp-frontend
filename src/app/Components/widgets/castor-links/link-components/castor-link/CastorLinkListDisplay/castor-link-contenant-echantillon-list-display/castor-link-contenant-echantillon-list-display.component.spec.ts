import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkContenantEchantillonListDisplayComponent } from './castor-link-contenant-echantillon-list-display.component';

describe('CastorLinkContenantEchantillonListDisplayComponent', () => {
  let component: CastorLinkContenantEchantillonListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkContenantEchantillonListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkContenantEchantillonListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkContenantEchantillonListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
