import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTagConfigurationComponent } from './project-tag-configuration.component';

describe('ProjectTagConfigurationComponent', () => {
  let component: ProjectTagConfigurationComponent;
  let fixture: ComponentFixture<ProjectTagConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectTagConfigurationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectTagConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
