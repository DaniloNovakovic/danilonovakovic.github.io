// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import {
  createCanonicalBridgeDesign,
  type BridgeDesign,
  type BridgePoint
} from '@/game/core/ridge';
import BridgeBuilderOverlay from './BridgeBuilderOverlay';

function renderOverlay(close = vi.fn()) {
  render(
    <BridgeBuilderOverlay
      close={close}
      enterScene={vi.fn()}
      openOverlay={vi.fn()}
      titleId="bridge-title"
      descriptionId="bridge-description"
    />
  );
  return close;
}

function board(): SVGSVGElement {
  return document.querySelector('svg[role="group"]') as SVGSVGElement;
}

function draw(start: BridgePoint, end: BridgePoint) {
  const svg = board();
  fireEvent.pointerDown(svg, { clientX: start.x, clientY: start.y, button: 0, pointerId: 1 });
  fireEvent.pointerMove(svg, { clientX: end.x, clientY: end.y, pointerId: 1 });
  fireEvent.pointerUp(svg, { clientX: end.x, clientY: end.y, button: 0, pointerId: 1 });
}

function traceCanonicalDesign() {
  const canonical = createCanonicalBridgeDesign();
  for (const beam of canonical.beams) {
    const a = canonical.nodes.find((node) => node.id === beam.a)!;
    const b = canonical.nodes.find((node) => node.id === beam.b)!;
    draw(a, b);
  }
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(SVGElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 640,
    bottom: 380,
    width: 640,
    height: 380,
    toJSON: () => ({})
  } as DOMRect);
  Object.assign(SVGElement.prototype, {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn()
  });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: true })
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  bridgeActions.resetProgress();
  bridgeActions.clearSceneUi();
  bridgeActions.closeOverlay();
});

describe('Blueprint Bridge physics sandbox', () => {
  it('draws freeform beams and cables and moves an arbitrary joint', () => {
    renderOverlay();
    draw({ x: 70, y: 210 }, { x: 190, y: 190 });
    expect(screen.getByText('1 pieces')).toBeDefined();
    expect(screen.getByText('1 free joints')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Cable' }));
    draw({ x: 190, y: 190 }, { x: 320, y: 90 });
    expect(document.querySelectorAll('.bridge-strut.is-cable')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Move' }));
    draw({ x: 190, y: 190 }, { x: 210, y: 180 });
    const firstBeam = document.querySelector('.bridge-strut');
    expect(firstBeam?.getAttribute('x2')).toBe('210');
    expect(firstBeam?.getAttribute('y2')).toBe('180');
  });

  it('runs a real car crossing and returns the freeform design to Ridge', () => {
    const close = renderOverlay();
    traceCanonicalDesign();
    expect(screen.getByText('15 pieces')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Test the car' }));
    advance(5000);
    expect(screen.getByText('CICKA APPROVED')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Use this bridge' }));
    const action = bridgeStore.getState().sceneUi.lastAction;
    expect(close).toHaveBeenCalledOnce();
    expect(action?.action).toBe('ridgeBridgeBuilderComplete');
    expect((action?.params as BridgeDesign).beams).toHaveLength(15);
  });

  it('keeps the design editable after the car fails', () => {
    renderOverlay();
    draw({ x: 70, y: 210 }, { x: 190, y: 210 });
    fireEvent.click(screen.getByRole('button', { name: 'Test the car' }));
    advance(6000);

    expect(screen.getByText('PHYSICS HAPPENED')).toBeDefined();
    expect(bridgeStore.getState().sceneUi.lastAction).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Edit & retry' }));
    expect(screen.getByText('1 pieces')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Test the car' })).toBeDefined();
  });
});
