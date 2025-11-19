import { TestBed } from '@angular/core/testing';

import { StratigraphicDiagramService } from './stratigraphic-diagram.service';

describe('StratigraphicDiagramService', () => {
  let service: StratigraphicDiagramService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StratigraphicDiagramService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
