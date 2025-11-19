import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorRowItemSecteurComponent } from './castor-row-item-secteur.component';

describe('CastorRowItemSecteurComponent', () => {
  let component: CastorRowItemSecteurComponent;
  let fixture: ComponentFixture<CastorRowItemSecteurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorRowItemSecteurComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorRowItemSecteurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
