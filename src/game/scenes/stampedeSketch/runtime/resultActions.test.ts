import { describe, expect, it } from 'vitest';
import {
  createStampedeResultActionGate,
  resolveStampedeResultKeyAction,
  resolveStampedeResultPointerAction
} from './resultActions';
import type { StampedeResultButtonBounds } from './resultPresentation';

describe('stampede result actions', () => {
  const buttonBounds: readonly StampedeResultButtonBounds[] = [
    {
      id: 'retry',
      x: 100,
      y: 200,
      width: 80,
      height: 40
    },
    {
      id: 'backToRidge',
      x: 220,
      y: 200,
      width: 120,
      height: 40
    }
  ];

  it('resolves pointer input inside retry bounds', () => {
    expect(resolveStampedeResultPointerAction(
      { x: 140, y: 220 },
      buttonBounds
    )).toBe('retry');
  });

  it('resolves pointer input inside back bounds', () => {
    expect(resolveStampedeResultPointerAction(
      { x: 300, y: 220 },
      buttonBounds
    )).toBe('backToRidge');
  });

  it('ignores pointer input outside result buttons', () => {
    expect(resolveStampedeResultPointerAction(
      { x: 99, y: 220 },
      buttonBounds
    )).toBeNull();
  });

  it('maps retry keys and ignores repeated keydown events', () => {
    expect(resolveStampedeResultKeyAction({ key: 'r' })).toBe('retry');
    expect(resolveStampedeResultKeyAction({ key: 'Enter' })).toBe('retry');
    expect(resolveStampedeResultKeyAction({ key: ' ' })).toBe('retry');
    expect(resolveStampedeResultKeyAction({ key: 'r', repeat: true })).toBeNull();
  });

  it('maps back keys and ignores unrelated keys', () => {
    expect(resolveStampedeResultKeyAction({ key: 'e' })).toBe('backToRidge');
    expect(resolveStampedeResultKeyAction({ key: 'H' })).toBe('backToRidge');
    expect(resolveStampedeResultKeyAction({ key: 'Escape' })).toBe('backToRidge');
    expect(resolveStampedeResultKeyAction({ key: 'w' })).toBeNull();
  });

  it('allows one result action until reset', () => {
    const gate = createStampedeResultActionGate();

    expect(gate.tryFire('retry')).toBe(true);
    expect(gate.tryFire('backToRidge')).toBe(false);

    gate.reset();
    expect(gate.tryFire('backToRidge')).toBe(true);
  });
});
