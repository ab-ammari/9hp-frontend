import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorLinkComponent } from './castor-link.component';

describe('CastorLinkComponent', () => {
  let component: CastorLinkComponent;
  let fixture: ComponentFixture<CastorLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorLinkComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
