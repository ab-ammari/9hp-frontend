import { TestBed } from '@angular/core/testing';

import { EdgeRelationResolverService } from './edge-relation-resolver.service';

describe('EdgeRelationResolverService', () => {
  let service: EdgeRelationResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EdgeRelationResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
