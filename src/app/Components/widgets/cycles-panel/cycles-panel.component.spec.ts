import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CyclesPanelComponent } from './cycles-panel.component';

describe('CyclesPanelComponent', () => {
  let component: CyclesPanelComponent;
  let fixture: ComponentFixture<CyclesPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CyclesPanelComponent]
    });
    fixture = TestBed.createComponent(CyclesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
