import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorRowItemMobilierComponent } from './castor-row-item-mobilier.component';

describe('CastorRowItemMobilierComponent', () => {
  let component: CastorRowItemMobilierComponent;
  let fixture: ComponentFixture<CastorRowItemMobilierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorRowItemMobilierComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorRowItemMobilierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
