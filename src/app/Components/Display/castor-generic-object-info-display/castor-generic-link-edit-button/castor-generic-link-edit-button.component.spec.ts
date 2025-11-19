import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorGenericLinkEditButtonComponent } from './castor-generic-link-edit-button.component';

describe('CastorGenericLinkEditButtonComponent', () => {
  let component: CastorGenericLinkEditButtonComponent;
  let fixture: ComponentFixture<CastorGenericLinkEditButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorGenericLinkEditButtonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CastorGenericLinkEditButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
