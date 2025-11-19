import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinuteLinkFormComponent } from './minute-link-form.component';

describe('MinuteLinkFormComponent', () => {
  let component: MinuteLinkFormComponent;
  let fixture: ComponentFixture<MinuteLinkFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MinuteLinkFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MinuteLinkFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
