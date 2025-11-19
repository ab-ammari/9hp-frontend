import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorRowItemUsComponent } from './castor-row-item-us.component';

describe('CastorRowItemUsComponent', () => {
  let component: CastorRowItemUsComponent;
  let fixture: ComponentFixture<CastorRowItemUsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorRowItemUsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorRowItemUsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
