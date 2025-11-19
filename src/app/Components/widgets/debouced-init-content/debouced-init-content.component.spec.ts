import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeboucedInitContentComponent } from './debouced-init-content.component';

describe('DeboucedInitContentComponent', () => {
  let component: DeboucedInitContentComponent;
  let fixture: ComponentFixture<DeboucedInitContentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DeboucedInitContentComponent]
    });
    fixture = TestBed.createComponent(DeboucedInitContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
