import { TestBed } from '@angular/core/testing';

import { DisplayResolver } from './display.resolver';

describe('DisplayResolver', () => {
  let resolver: DisplayResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(DisplayResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
