// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { readRouteStateFromSearch } from './useReadMode';

describe('readRouteStateFromSearch', () => {
  it('keeps normal public modes available', () => {
    expect(readRouteStateFromSearch('?mode=interactive', false)).toBe('interactive');
    expect(readRouteStateFromSearch('?mode=static', false)).toBe('static');
  });

  it('only exposes the Ridge Stage Debugger in dev mode', () => {
    expect(readRouteStateFromSearch('?mode=ridge-stage-debugger', true)).toBe('ridge-stage-debugger');
    expect(readRouteStateFromSearch('?mode=ridge-stage-debugger', false)).toBe('picker');
    expect(readRouteStateFromSearch('?mode=ridge-blockout', true)).toBe('picker');
  });
});
