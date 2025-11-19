import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorRowItemSectionComponent } from './castor-row-item-section.component';

describe('CastorRowItemSondageComponent', () => {
  let component: CastorRowItemSectionComponent;
  let fixture: ComponentFixture<CastorRowItemSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorRowItemSectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorRowItemSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
