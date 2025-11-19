import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StratigraphicTestComponent } from './stratigraphic-test.component';

describe('StratigraphicTestComponent', () => {
  let component: StratigraphicTestComponent;
  let fixture: ComponentFixture<StratigraphicTestComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StratigraphicTestComponent]
    });
    fixture = TestBed.createComponent(StratigraphicTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
