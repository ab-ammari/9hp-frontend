import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingPanelComponent } from './floating-panel.component';

describe('FloatingPanelComponent', () => {
  let component: FloatingPanelComponent;
  let fixture: ComponentFixture<FloatingPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FloatingPanelComponent]
    });
    fixture = TestBed.createComponent(FloatingPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
