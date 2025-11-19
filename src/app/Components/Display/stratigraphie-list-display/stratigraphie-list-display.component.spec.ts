import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StratigraphieListDisplayComponent } from './stratigraphie-list-display.component';

describe('StratigraphieListDisplayComponent', () => {
  let component: StratigraphieListDisplayComponent;
  let fixture: ComponentFixture<StratigraphieListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StratigraphieListDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StratigraphieListDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
