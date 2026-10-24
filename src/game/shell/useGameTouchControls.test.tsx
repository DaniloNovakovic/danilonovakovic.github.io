// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import { useGameTouchControls } from './useGameTouchControls';

function TouchSurface() {
  const controls = useGameTouchControls({ isPaused: false });
  return (
    <div
      data-testid="touch"
      onPointerCancel={controls.onPointerCancel}
      onPointerDown={controls.onPointerDown}
      onPointerLeave={controls.onPointerLeave}
      onPointerMove={controls.onPointerMove}
      onPointerUp={controls.onPointerUp}
    />
  );
}

describe('useGameTouchControls', () => {
  beforeEach(() => {
    bridgeActions.resetTouch();
  });

  afterEach(() => {
    cleanup();
  });

  it('still queues interact when the captured pointer leaves before release', () => {
    render(<TouchSurface />);
    const touch = screen.getByTestId('touch');
    touch.setPointerCapture = () => undefined;
    touch.hasPointerCapture = () => true;

    fireEvent.pointerDown(touch, { pointerId: 1, clientX: 20, clientY: 20, pointerType: 'touch' });
    fireEvent.pointerLeave(touch, { pointerId: 1, clientX: 20, clientY: 20, pointerType: 'touch' });
    fireEvent.pointerUp(touch, { pointerId: 1, clientX: 20, clientY: 20, pointerType: 'touch' });

    expect(bridgeStore.getState().touch.interactTap).toBe(true);
  });

  it('keeps a captured drag that leaves the surface and does not turn it into a tap', () => {
    render(<TouchSurface />);
    const touch = screen.getByTestId('touch');
    touch.setPointerCapture = () => undefined;
    touch.hasPointerCapture = () => true;

    fireEvent.pointerDown(touch, { pointerId: 1, clientX: 20, clientY: 20, pointerType: 'touch' });
    fireEvent.pointerMove(touch, { pointerId: 1, clientX: 50, clientY: 20, pointerType: 'touch' });

    expect(bridgeStore.getState().touch.right).toBeGreaterThan(0);

    fireEvent.pointerLeave(touch, { pointerId: 1, clientX: 50, clientY: 20, pointerType: 'touch' });
    expect(bridgeStore.getState().touch.right).toBeGreaterThan(0);

    fireEvent.pointerUp(touch, { pointerId: 1, clientX: 50, clientY: 20, pointerType: 'touch' });
    expect(bridgeStore.getState().touch.interactTap).toBe(false);
    expect(bridgeStore.getState().touch.right).toBe(0);
  });

  it('still queues interact when captured travel stays inside the tap threshold', () => {
    render(<TouchSurface />);
    const touch = screen.getByTestId('touch');
    touch.setPointerCapture = () => undefined;
    touch.hasPointerCapture = () => true;

    fireEvent.pointerDown(touch, { pointerId: 1, clientX: 20, clientY: 20, pointerType: 'touch' });
    fireEvent.pointerMove(touch, { pointerId: 1, clientX: 30, clientY: 24, pointerType: 'touch' });
    fireEvent.pointerLeave(touch, { pointerId: 1, clientX: 30, clientY: 24, pointerType: 'touch' });
    fireEvent.pointerUp(touch, { pointerId: 1, clientX: 30, clientY: 24, pointerType: 'touch' });

    expect(bridgeStore.getState().touch.interactTap).toBe(true);
  });

  it('does not queue interact when an uncaptured pointer leaves', () => {
    render(<TouchSurface />);
    const touch = screen.getByTestId('touch');
    touch.setPointerCapture = () => undefined;
    touch.hasPointerCapture = () => false;

    fireEvent.pointerDown(touch, { pointerId: 1, clientX: 20, clientY: 20, pointerType: 'touch' });
    fireEvent.pointerLeave(touch, { pointerId: 1, clientX: 4, clientY: 20, pointerType: 'touch' });
    fireEvent.pointerUp(touch, { pointerId: 1, clientX: 4, clientY: 20, pointerType: 'touch' });

    expect(bridgeStore.getState().touch.interactTap).toBe(false);
  });
});
