import { TestBed } from '@angular/core/testing';

import { DiagramParadoxModeService } from './diagram-paradox-mode.service';

describe('DiagramParadoxModeService', () => {
  let service: DiagramParadoxModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiagramParadoxModeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
