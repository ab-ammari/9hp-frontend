import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkTopoEchantillonListDisplayComponent } from './castor-link-topo-echantillon-list-display.component';

describe('CastorLinkTopoEchantillonListDisplayComponent', () => {
  let component: CastorLinkTopoEchantillonListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkTopoEchantillonListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkTopoEchantillonListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkTopoEchantillonListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
