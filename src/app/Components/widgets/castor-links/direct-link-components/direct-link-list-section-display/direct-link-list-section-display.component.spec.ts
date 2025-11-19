import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectLinkListSectionDisplayComponent } from './direct-link-list-section-display.component';

describe('DirectLinkListSectionComponent', () => {
  let component: DirectLinkListSectionDisplayComponent;
  let fixture: ComponentFixture<DirectLinkListSectionDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectLinkListSectionDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DirectLinkListSectionDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
