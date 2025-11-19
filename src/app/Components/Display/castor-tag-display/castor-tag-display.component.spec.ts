import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorTagDisplayComponent } from './castor-tag-display.component';

describe('CastorTagDisplayComponent', () => {
  let component: CastorTagDisplayComponent;
  let fixture: ComponentFixture<CastorTagDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorTagDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorTagDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
