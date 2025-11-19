import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorTypeDisplayComponent } from './castor-type-display.component';

describe('CastorTypeDisplayComponent', () => {
  let component: CastorTypeDisplayComponent;
  let fixture: ComponentFixture<CastorTypeDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorTypeDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorTypeDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
