import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {of} from 'rxjs';
import {ProjetDisplayCardComponent} from './projet-display-card.component';
import {WorkerService} from '../../../services/worker.service';
import {ToastService} from '../../../services/toast.service';

const workerServiceStub = {
  data: () => ({
    projet: {
      selected: {
        select: () => of(null)
      }
    },
    objectsToFetch: [],
    archive: {pending: 0}
  }),
  trigger: () => {},
  network: () => of({payload: {}})
};

const toastServiceStub = {
  success: () => {},
  error: () => {}
};

describe('ProjetDisplayCardComponent', () => {
  let component: ProjetDisplayCardComponent;
  let fixture: ComponentFixture<ProjetDisplayCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjetDisplayCardComponent],
      providers: [
        {provide: WorkerService, useValue: workerServiceStub},
        {provide: ToastService, useValue: toastServiceStub}
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjetDisplayCardComponent);
    component = fixture.componentInstance;
    component.DB = {
      database: {
        project_index: {
          index: [],
          onIndexUpdate: {
            pipe: () => of()
          }
        }
      }
    } as any;
    component.project = {
      item: {
        projet_uuid: 'test-uuid',
        write_lock_enabled: false
      },
      onValueChange: () => of({
        projet_uuid: 'test-uuid'
      })
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
