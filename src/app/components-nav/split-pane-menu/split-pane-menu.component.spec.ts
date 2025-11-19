import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitPaneMenuComponent } from './split-pane-menu.component';

describe('SplitPaneMenuComponent', () => {
  let component: SplitPaneMenuComponent;
  let fixture: ComponentFixture<SplitPaneMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SplitPaneMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SplitPaneMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
