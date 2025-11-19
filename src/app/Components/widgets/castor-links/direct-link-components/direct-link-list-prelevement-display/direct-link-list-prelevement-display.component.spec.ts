import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectLinkListPrelevementDisplayComponent } from './direct-link-list-prelevement-display.component';

describe('DirectLinkListPrelevementDisplayComponent', () => {
  let component: DirectLinkListPrelevementDisplayComponent;
  let fixture: ComponentFixture<DirectLinkListPrelevementDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectLinkListPrelevementDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DirectLinkListPrelevementDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
