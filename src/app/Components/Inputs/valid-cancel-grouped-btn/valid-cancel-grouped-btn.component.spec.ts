import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidCancelGroupedBtnComponent } from './valid-cancel-grouped-btn.component';

describe('ValidCancelGroupedBtnComponent', () => {
  let component: ValidCancelGroupedBtnComponent;
  let fixture: ComponentFixture<ValidCancelGroupedBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ValidCancelGroupedBtnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidCancelGroupedBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
