import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorTagInputComponent } from './castor-tag-input.component';

describe('CastorTagInputComponent', () => {
  let component: CastorTagInputComponent;
  let fixture: ComponentFixture<CastorTagInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorTagInputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorTagInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
