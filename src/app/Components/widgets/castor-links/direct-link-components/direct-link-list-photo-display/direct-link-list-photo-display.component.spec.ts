import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectLinkListPhotoDisplayComponent } from './direct-link-list-photo-display.component';

describe('DirectLinkListPhotoDisplayComponent', () => {
  let component: DirectLinkListPhotoDisplayComponent;
  let fixture: ComponentFixture<DirectLinkListPhotoDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectLinkListPhotoDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DirectLinkListPhotoDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
