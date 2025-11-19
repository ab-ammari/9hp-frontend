import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StratigraphieFormComponent } from './stratigraphie-form.component';

describe('UsStratigraphieFormComponent', () => {
  let component: StratigraphieFormComponent;
  let fixture: ComponentFixture<StratigraphieFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StratigraphieFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StratigraphieFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
