import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaitSectionLinkFormComponent } from './fait-section-link-form.component';

describe('FaitSectionLinkFormComponent', () => {
  let component: FaitSectionLinkFormComponent;
  let fixture: ComponentFixture<FaitSectionLinkFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FaitSectionLinkFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FaitSectionLinkFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
