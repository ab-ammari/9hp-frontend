import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeadbandItemHeaderComponent } from './headband-item-header.component';

describe('HeadbandItemHeaderComponent', () => {
  let component: HeadbandItemHeaderComponent;
  let fixture: ComponentFixture<HeadbandItemHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HeadbandItemHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeadbandItemHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
