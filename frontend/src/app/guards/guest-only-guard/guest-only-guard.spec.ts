import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { loggedInUserGuard } from './guest-only-guard';

describe('loggedInUserGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
      TestBed.runInInjectionContext(() => loggedInUserGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
