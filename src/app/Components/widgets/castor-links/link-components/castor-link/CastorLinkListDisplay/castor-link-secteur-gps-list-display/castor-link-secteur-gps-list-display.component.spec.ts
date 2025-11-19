import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkSecteurGpsListDisplayComponent } from './castor-link-secteur-gps-list-display.component';

describe('CastorLinkSecteurGpsListDisplayComponent', () => {
  let component: CastorLinkSecteurGpsListDisplayComponent;
  let fixture: ComponentFixture<CastorLinkSecteurGpsListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkSecteurGpsListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkSecteurGpsListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
