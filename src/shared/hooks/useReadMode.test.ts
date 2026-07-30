// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { readRouteStateFromSearch } from './useReadMode';

describe('readRouteStateFromSearch', () => {
  it('keeps normal public modes available', () => {
    expect(readRouteStateFromSearch('?mode=interactive')).toBe('interactive');
    expect(readRouteStateFromSearch('?mode=static')).toBe('static');
  });

  it('ignores removed Ridge debugger mode', () => {
    expect(readRouteStateFromSearch('?mode=ridge-debugger')).toBe('picker');
    expect(readRouteStateFromSearch('?mode=ridge-blockout')).toBe('picker');
  });
});
