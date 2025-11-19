import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericDocumentTableComponent } from './generic-document-table.component';

describe('GenericDocumentTableComponent', () => {
  let component: GenericDocumentTableComponent;
  let fixture: ComponentFixture<GenericDocumentTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GenericDocumentTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenericDocumentTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
