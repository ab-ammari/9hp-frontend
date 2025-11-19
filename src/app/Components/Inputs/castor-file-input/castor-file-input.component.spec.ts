import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorFileInputComponent } from './castor-file-input.component';

describe('CastorFileInputComponent', () => {
  let component: CastorFileInputComponent;
  let fixture: ComponentFixture<CastorFileInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorFileInputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorFileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
