import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditModeIndicatorComponent } from './edit-mode-indicator.component';

describe('EditModeIndicatorComponent', () => {
  let component: EditModeIndicatorComponent;
  let fixture: ComponentFixture<EditModeIndicatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditModeIndicatorComponent]
    });
    fixture = TestBed.createComponent(EditModeIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
