import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorStratigraphieVisualizationComponent } from './castor-stratigraphie-visualization.component';

describe('CastorStratigraphieVisualizationComponent', () => {
  let component: CastorStratigraphieVisualizationComponent;
  let fixture: ComponentFixture<CastorStratigraphieVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorStratigraphieVisualizationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CastorStratigraphieVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
