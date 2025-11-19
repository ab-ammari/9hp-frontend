import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorRowItemTopoComponent } from './castor-row-item-topo.component';

describe('CastorRowItemTopoComponent', () => {
  let component: CastorRowItemTopoComponent;
  let fixture: ComponentFixture<CastorRowItemTopoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorRowItemTopoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorRowItemTopoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
