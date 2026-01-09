import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StratigraphicDiagramComponent } from './stratigraphic-diagram.component';

describe('StratigraphicDiagramComponent', () => {
  let component: StratigraphicDiagramComponent;
  let fixture: ComponentFixture<StratigraphicDiagramComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StratigraphicDiagramComponent]
    });
    fixture = TestBed.createComponent(StratigraphicDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
