import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataPanelComponent } from './data-panel.component';

describe('DataPanelComponent', () => {
  let component: DataPanelComponent;
  let fixture: ComponentFixture<DataPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DataPanelComponent]
    });
    fixture = TestBed.createComponent(DataPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});