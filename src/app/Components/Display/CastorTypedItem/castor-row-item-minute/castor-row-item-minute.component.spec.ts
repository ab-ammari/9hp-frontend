import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorRowItemMinuteComponent } from './castor-row-item-minute.component';

describe('CastorRowItemMinuteComponent', () => {
  let component: CastorRowItemMinuteComponent;
  let fixture: ComponentFixture<CastorRowItemMinuteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorRowItemMinuteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorRowItemMinuteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
