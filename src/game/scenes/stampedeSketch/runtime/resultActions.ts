import type {
  StampedeResultActionId,
  StampedeResultButtonBounds
} from './resultPresentation';

export interface StampedeResultPoint {
  x: number;
  y: number;
}

export interface StampedeResultKeyInput {
  key: string;
  repeat?: boolean;
}

export interface StampedeResultActionGate {
  tryFire(actionId: StampedeResultActionId): boolean;
  reset(): void;
}

export function resolveStampedeResultPointerAction(
  point: StampedeResultPoint,
  bounds: readonly StampedeResultButtonBounds[]
): StampedeResultActionId | null {
  return bounds.find((buttonBounds) =>
    pointIsWithinBounds(point, buttonBounds)
  )?.id ?? null;
}

export function resolveStampedeResultKeyAction({
  key,
  repeat = false
}: StampedeResultKeyInput): StampedeResultActionId | null {
  if (repeat) return null;

  switch (key.toLowerCase()) {
    case 'r':
    case 'enter':
    case ' ':
    case 'space':
      return 'retry';
    case 'e':
    case 'h':
    case 'escape':
      return 'backToRidge';
    default:
      return null;
  }
}

export function createStampedeResultActionGate(): StampedeResultActionGate {
  let fired = false;

  return {
    tryFire() {
      if (fired) return false;
      fired = true;
      return true;
    },
    reset() {
      fired = false;
    }
  };
}

function pointIsWithinBounds(
  point: StampedeResultPoint,
  bounds: StampedeResultButtonBounds
): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}
