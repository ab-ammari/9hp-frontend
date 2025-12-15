import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FocusedDiagramViewerComponent } from './focused-diagram-viewer.component';

describe('FocusedDiagramViewerComponent', () => {
  let component: FocusedDiagramViewerComponent;
  let fixture: ComponentFixture<FocusedDiagramViewerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FocusedDiagramViewerComponent]
    });
    fixture = TestBed.createComponent(FocusedDiagramViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
