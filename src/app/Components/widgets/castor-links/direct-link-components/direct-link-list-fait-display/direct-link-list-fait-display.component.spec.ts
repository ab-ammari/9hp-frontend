import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectLinkListFaitDisplayComponent } from './direct-link-list-fait-display.component';

describe('DirectLinkListFaitDisplayComponent', () => {
  let component: DirectLinkListFaitDisplayComponent;
  let fixture: ComponentFixture<DirectLinkListFaitDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectLinkListFaitDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DirectLinkListFaitDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
