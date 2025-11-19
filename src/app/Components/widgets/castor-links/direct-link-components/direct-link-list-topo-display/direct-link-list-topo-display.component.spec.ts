import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectLinkListTopoDisplayComponent } from './direct-link-list-topo-display.component';

describe('DirectLinkListTopoDisplayComponent', () => {
  let component: DirectLinkListTopoDisplayComponent;
  let fixture: ComponentFixture<DirectLinkListTopoDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectLinkListTopoDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DirectLinkListTopoDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
