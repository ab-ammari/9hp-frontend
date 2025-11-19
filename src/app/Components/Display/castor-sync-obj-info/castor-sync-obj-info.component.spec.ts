import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorSyncObjInfoComponent } from './castor-sync-obj-info.component';

describe('CastorSyncObjInfoComponent', () => {
  let component: CastorSyncObjInfoComponent;
  let fixture: ComponentFixture<CastorSyncObjInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorSyncObjInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorSyncObjInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
