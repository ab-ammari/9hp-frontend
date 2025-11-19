import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericLinkedObjectTagListComponent } from './generic-linked-object-tag-list.component';

describe('GenericLinkedObjectTagListComponent', () => {
  let component: GenericLinkedObjectTagListComponent;
  let fixture: ComponentFixture<GenericLinkedObjectTagListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GenericLinkedObjectTagListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GenericLinkedObjectTagListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
