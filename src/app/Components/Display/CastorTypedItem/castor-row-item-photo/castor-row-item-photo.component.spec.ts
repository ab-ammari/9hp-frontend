import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorRowItemPhotoComponent } from './castor-row-item-photo.component';

describe('CastorRowItemPhotoComponent', () => {
  let component: CastorRowItemPhotoComponent;
  let fixture: ComponentFixture<CastorRowItemPhotoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorRowItemPhotoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorRowItemPhotoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
