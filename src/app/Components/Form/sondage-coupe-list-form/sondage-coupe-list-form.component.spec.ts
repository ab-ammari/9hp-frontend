import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SondageCoupeListFormComponent } from './sondage-coupe-list-form.component';

describe('SondageCoupeListFormComponent', () => {
  let component: SondageCoupeListFormComponent;
  let fixture: ComponentFixture<SondageCoupeListFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SondageCoupeListFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SondageCoupeListFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
