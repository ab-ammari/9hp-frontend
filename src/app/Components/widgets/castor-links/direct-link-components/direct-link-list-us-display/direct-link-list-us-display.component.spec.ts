import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectLinkListUsDisplayComponent } from './direct-link-list-us-display.component';

describe('DirectLinkListUsDisplayComponent', () => {
  let component: DirectLinkListUsDisplayComponent;
  let fixture: ComponentFixture<DirectLinkListUsDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectLinkListUsDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DirectLinkListUsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
