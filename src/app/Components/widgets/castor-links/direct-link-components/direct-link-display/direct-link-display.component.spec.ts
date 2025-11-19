import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectLinkDisplayComponent } from './direct-link-display.component';

describe('DirectLinkDisplayComponent', () => {
  let component: DirectLinkDisplayComponent;
  let fixture: ComponentFixture<DirectLinkDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectLinkDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DirectLinkDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
