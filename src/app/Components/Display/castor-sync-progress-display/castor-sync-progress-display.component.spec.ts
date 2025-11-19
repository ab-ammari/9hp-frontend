import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorSyncProgressDisplayComponent } from './castor-sync-progress-display.component';

describe('CastorSyncProgressDisplayComponent', () => {
  let component: CastorSyncProgressDisplayComponent;
  let fixture: ComponentFixture<CastorSyncProgressDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorSyncProgressDisplayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CastorSyncProgressDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
