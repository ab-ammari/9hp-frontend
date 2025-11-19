import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectLinkListMinuteDisplayComponent } from './direct-link-list-minute-display.component';

describe('DirectLinkListMinuteDisplayComponent', () => {
  let component: DirectLinkListMinuteDisplayComponent;
  let fixture: ComponentFixture<DirectLinkListMinuteDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectLinkListMinuteDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DirectLinkListMinuteDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
