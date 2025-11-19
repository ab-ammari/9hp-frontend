import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsNegativeFormComponent } from './us-negative-form.component';

describe('UsNegativeFormComponent', () => {
  let component: UsNegativeFormComponent;
  let fixture: ComponentFixture<UsNegativeFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UsNegativeFormComponent]
    });
    fixture = TestBed.createComponent(UsNegativeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
