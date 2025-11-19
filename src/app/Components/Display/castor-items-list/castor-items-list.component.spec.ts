import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorItemsListComponent } from './castor-items-list.component';

describe('CastorItemsListComponent', () => {
  let component: CastorItemsListComponent;
  let fixture: ComponentFixture<CastorItemsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorItemsListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorItemsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
