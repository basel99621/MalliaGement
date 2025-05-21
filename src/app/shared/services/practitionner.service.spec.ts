import { TestBed } from '@angular/core/testing';

import { PractitionnerService } from './practitionner.service';

describe('PractitionnerService', () => {
  let service: PractitionnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PractitionnerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
