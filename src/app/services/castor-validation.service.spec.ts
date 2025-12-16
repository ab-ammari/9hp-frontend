import {TestBed} from '@angular/core/testing';
import {CastorValidationService} from './castor-validation.service';
import {WorkerService} from './worker.service';
import {Subject} from 'rxjs';
import {ApiDbTable, ApiStratigraphie} from '../../../shared';

class WorkerServiceStub {
  private change$ = new Subject<void>();
  private rootData: any;

  constructor(relations: ApiStratigraphie[]) {
    this.rootData = this.buildRoot(relations);
  }

  data() {
    return this.rootData;
  }

  setRelations(relations: ApiStratigraphie[]) {
    this.rootData = this.buildRoot(relations);
    this.change$.next();
  }

  private buildRoot(relations: ApiStratigraphie[]) {
    return {
      objects: {
        stratigraphie: {
          all: {
            list: relations.map(item => ({item})),
            onValueChange: () => this.change$.asObservable()
          }
        }
      },
      user: {user_uuid: 'user-uuid'},
      archive: {pending: 0},
      status: {syncStatus: 'run', online: true}
    };
  }
}

function makeStratigraphie(partial: Partial<ApiStratigraphie> & {stratigraphie_uuid: string}): ApiStratigraphie {
  return {
    author_uuid: 'author',
    live: true,
    versions: [],
    projet_uuid: 'projet',
    table: ApiDbTable.stratigraphie,
    fait_anterieur: undefined,
    fait_posterieur: undefined,
    us_anterieur: undefined,
    us_posterieur: undefined,
    is_contemporain: false,
    strati_type_uuid: 'type',
    ...partial
  } as ApiStratigraphie;
}

function initService(relations: ApiStratigraphie[], disableWorker = true) {
  const worker = new WorkerServiceStub(relations);
  const originalWorker = (window as any).Worker;
  if (disableWorker) {
    (window as any).Worker = undefined as unknown as typeof Worker;
  }
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      CastorValidationService,
      {provide: WorkerService, useValue: worker}
    ]
  });
  const service = TestBed.inject(CastorValidationService);
  if (disableWorker) {
    (window as any).Worker = originalWorker;
  }
  return {service, worker};
}

describe('CastorValidationService', () => {
  it('retourne true pour une relation simple', async () => {
    const simpleRelation = makeStratigraphie({
      stratigraphie_uuid: 's1',
      us_anterieur: 'us-1',
      us_posterieur: 'us-2'
    });
    const {service} = initService([simpleRelation]);

    const result = await service.validateStratigraphie(simpleRelation);

    expect(result.result).toBeTrue();
  });

  it('réutilise le cache pour la même stratigraphie', async () => {
    const relation = makeStratigraphie({
      stratigraphie_uuid: 'cache-test',
      us_anterieur: 'us-a',
      us_posterieur: 'us-b'
    });
    const {service} = initService([relation]);
    const spy = spyOn<any>(service, 'getConnectedRelations').and.callThrough();

    await service.validateStratigraphie(relation);
    expect(spy.calls.count()).toBeGreaterThan(0);

    const callCountAfterFirst = spy.calls.count();
    await service.validateStratigraphie(relation);
    expect(spy.calls.count()).toBe(callCountAfterFirst);
  });

  it('vide le cache après une mise à jour des données', async () => {
    const initial = makeStratigraphie({
      stratigraphie_uuid: 'initial',
      us_anterieur: 'us-a',
      us_posterieur: 'us-b'
    });
    const updated = makeStratigraphie({
      stratigraphie_uuid: 'updated',
      us_anterieur: 'us-b',
      us_posterieur: 'us-c'
    });
    const {service, worker} = initService([initial]);
    const spy = spyOn<any>(service, 'getConnectedRelations').and.callThrough();

    await service.validateStratigraphie(initial);
    expect((service as any).validationCache.size).toBe(1);

    worker.setRelations([initial, updated]);

    expect((service as any).validationCache.size).toBe(0);

    await service.validateStratigraphie(initial);
    expect(spy.calls.count()).toBeGreaterThan(0);
  });

  it('détecte une relation auto-ciblée et retourne false', async () => {
    const invalid = makeStratigraphie({
      stratigraphie_uuid: 'invalid',
      us_anterieur: 'us-x',
      us_posterieur: 'us-x'
    });
    const {service} = initService([invalid]);

    const result = await service.validateStratigraphie(invalid);

    expect(result.result).toBeFalse();
    expect(result.message).toContain('SELF TARGETING');
  });
});
