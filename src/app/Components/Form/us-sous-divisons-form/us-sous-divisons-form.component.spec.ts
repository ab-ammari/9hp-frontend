import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsSousDivisonsFormComponent } from './us-sous-divisons-form.component';

describe('UsSousDivisonsComponent', () => {
  let component: UsSousDivisonsFormComponent;
  let fixture: ComponentFixture<UsSousDivisonsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsSousDivisonsFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsSousDivisonsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
