// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { readRouteStateFromSearch } from './useReadMode';

describe('readRouteStateFromSearch', () => {
  it('keeps normal public modes available', () => {
    expect(readRouteStateFromSearch('?mode=interactive', false)).toBe('interactive');
    expect(readRouteStateFromSearch('?mode=static', false)).toBe('static');
  });

  it('only exposes the Ridge blockout viewer in dev mode', () => {
    expect(readRouteStateFromSearch('?mode=ridge-blockout', true)).toBe('ridge-blockout');
    expect(readRouteStateFromSearch('?mode=ridge-blockout', false)).toBe('picker');
  });
});
