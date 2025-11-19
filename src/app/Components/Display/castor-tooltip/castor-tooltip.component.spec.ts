import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorTooltipComponent } from './castor-tooltip.component';

describe('CastorTooltipComponent', () => {
  let component: CastorTooltipComponent;
  let fixture: ComponentFixture<CastorTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorTooltipComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
