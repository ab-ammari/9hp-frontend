import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkEditingModalComponent } from './link-editing-modal.component';

describe('LinkEditingModalComponent', () => {
  let component: LinkEditingModalComponent;
  let fixture: ComponentFixture<LinkEditingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LinkEditingModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LinkEditingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
