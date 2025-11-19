import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckSyncIconComponent } from './check-sync-icon.component';

describe('CheckSyncIconComponent', () => {
  let component: CheckSyncIconComponent;
  let fixture: ComponentFixture<CheckSyncIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CheckSyncIconComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckSyncIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
