import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorRowItemFaitComponent } from './castor-row-item-fait.component';

describe('CastorRowItemFaitComponent', () => {
  let component: CastorRowItemFaitComponent;
  let fixture: ComponentFixture<CastorRowItemFaitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorRowItemFaitComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorRowItemFaitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
