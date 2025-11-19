import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorUserItemDisplayComponent } from './castor-user-item-display.component';

describe('CastorUserItemDisplayComponent', () => {
  let component: CastorUserItemDisplayComponent;
  let fixture: ComponentFixture<CastorUserItemDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorUserItemDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorUserItemDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
