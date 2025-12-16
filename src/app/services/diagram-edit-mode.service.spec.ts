import { TestBed } from "@angular/core/testing";

import { DiagramEditModeService } from "./diagram-edit-mode.service";

describe('DiagramEditModeService', () => {
  let service: DiagramEditModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiagramEditModeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});