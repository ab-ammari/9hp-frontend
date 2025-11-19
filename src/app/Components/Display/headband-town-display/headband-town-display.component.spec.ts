import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeadbandTownDisplayComponent } from './headband-town-display.component';

describe('HeadbandTownDisplayComponent', () => {
  let component: HeadbandTownDisplayComponent;
  let fixture: ComponentFixture<HeadbandTownDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HeadbandTownDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeadbandTownDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
