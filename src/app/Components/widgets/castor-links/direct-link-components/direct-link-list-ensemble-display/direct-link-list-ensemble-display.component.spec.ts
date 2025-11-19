import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectLinkListEnsembleDisplayComponent } from './direct-link-list-ensemble-display.component';

describe('DirectLinkListEnsembleDisplayComponent', () => {
  let component: DirectLinkListEnsembleDisplayComponent;
  let fixture: ComponentFixture<DirectLinkListEnsembleDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectLinkListEnsembleDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DirectLinkListEnsembleDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
