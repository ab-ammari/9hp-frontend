import { TestBed } from '@angular/core/testing';

import { CastorAuthorizationService } from './castor-authorization-service.service';

describe('CastorAuthorizationServiceService', () => {
  let service: CastorAuthorizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CastorAuthorizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
