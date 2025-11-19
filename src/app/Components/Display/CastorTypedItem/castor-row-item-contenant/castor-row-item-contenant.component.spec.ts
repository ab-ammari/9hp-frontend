import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorRowItemContenantComponent } from './castor-row-item-contenant.component';

describe('CastorRowItemContenantComponent', () => {
  let component: CastorRowItemContenantComponent;
  let fixture: ComponentFixture<CastorRowItemContenantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorRowItemContenantComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorRowItemContenantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
