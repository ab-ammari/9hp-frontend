import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTypeConfigurationComponent } from './project-type-configuration.component';

describe('ProjectTypeConfigurationComponent', () => {
  let component: ProjectTypeConfigurationComponent;
  let fixture: ComponentFixture<ProjectTypeConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectTypeConfigurationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTypeConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
