import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorRowItemPrelevementComponent } from './castor-row-item-prelevement.component';

describe('CastorRowItemPrelevementComponent', () => {
  let component: CastorRowItemPrelevementComponent;
  let fixture: ComponentFixture<CastorRowItemPrelevementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorRowItemPrelevementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorRowItemPrelevementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
