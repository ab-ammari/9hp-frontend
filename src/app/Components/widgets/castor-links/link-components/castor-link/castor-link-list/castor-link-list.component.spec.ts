import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkListComponent } from './castor-link-list.component';

describe('CastorLinkListComponent', () => {
  let component: CastorLinkListComponent;
  let fixture: ComponentFixture<CastorLinkListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
