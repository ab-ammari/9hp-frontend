import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectLinkListMobilierDisplayComponent } from './direct-link-list-mobilier-display.component';

describe('DirectLinkListMobilierDisplayComponent', () => {
  let component: DirectLinkListMobilierDisplayComponent;
  let fixture: ComponentFixture<DirectLinkListMobilierDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectLinkListMobilierDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DirectLinkListMobilierDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
