import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorTypeSelectorComponent } from './castor-type-selector.component';

describe('CastorTypeSelectorComponent', () => {
  let component: CastorTypeSelectorComponent;
  let fixture: ComponentFixture<CastorTypeSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorTypeSelectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorTypeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
