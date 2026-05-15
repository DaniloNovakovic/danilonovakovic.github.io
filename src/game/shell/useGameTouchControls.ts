import { useRef, useState } from 'react';
import { bridgeActions } from '@/game/bridge/store';
import { useTouchGestures } from '@/shared/hooks/useTouchGestures';
import type { PointerEvent } from 'react';

interface UseGameTouchControlsOptions {
  isPaused: boolean;
}

type TouchDirection = 'left' | 'right' | 'up' | 'down';

const JOYSTICK_RADIUS_PX = 48;
const JOYSTICK_KNOB_RADIUS_PX = 34;
const JOYSTICK_DEADZONE = 0.18;

export function useGameTouchControls({ isPaused }: UseGameTouchControlsOptions) {
  const joystickPointerId = useRef<number | null>(null);
  const [joystickOffset, setJoystickOffset] = useState({ x: 0, y: 0 });

  function setDirection(direction: TouchDirection, intensity: number): void {
    if (isPaused && intensity > 0) return;
    bridgeActions.setTouchDirectional(direction, intensity);
  }

  function setDirectionalAxes(horizontalAxis: number, verticalAxis: number): void {
    setDirection('left', Math.max(0, -horizontalAxis));
    setDirection('right', Math.max(0, horizontalAxis));
    setDirection('up', Math.max(0, -verticalAxis));
    setDirection('down', Math.max(0, verticalAxis));
  }

  function stopPointer(e: PointerEvent): void {
    e.preventDefault();
    e.stopPropagation();
  }

  const gestureHandlers = useTouchGestures({
    onSwipeLeft: (intensity) => {
      setDirection('left', intensity);
      setDirection('right', 0);
    },
    onSwipeRight: (intensity) => {
      setDirection('right', intensity);
      setDirection('left', 0);
    },
    onSwipeUp: () => {
      if (isPaused) return;
      bridgeActions.queueJump();
    },
    onSwipeEnd: () => {
      setDirection('left', 0);
      setDirection('right', 0);
      setDirection('up', 0);
      setDirection('down', 0);
    },
    onTap: () => {
      if (isPaused) return;
      bridgeActions.tapInteract();
    }
  });

  function getDirectionalButtonHandlers(direction: TouchDirection) {
    return {
      onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
        stopPointer(e);
        e.currentTarget.setPointerCapture(e.pointerId);
        setDirection(direction, 1);
      },
      onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
        stopPointer(e);
        setDirection(direction, 0);
      },
      onPointerCancel: (e: PointerEvent<HTMLButtonElement>) => {
        stopPointer(e);
        setDirection(direction, 0);
      },
      onPointerLeave: (e: PointerEvent<HTMLButtonElement>) => {
        stopPointer(e);
        setDirection(direction, 0);
      }
    };
  }

  function updateJoystick(e: PointerEvent<HTMLDivElement>): void {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = (e.clientX - centerX) / JOYSTICK_RADIUS_PX;
    const rawY = (e.clientY - centerY) / JOYSTICK_RADIUS_PX;
    const length = Math.hypot(rawX, rawY);
    const scale = length > 1 ? 1 / length : 1;
    const clampedX = rawX * scale;
    const clampedY = rawY * scale;
    const active = length >= JOYSTICK_DEADZONE;
    const axisX = active ? clampedX : 0;
    const axisY = active ? clampedY : 0;

    setDirectionalAxes(axisX, axisY);
    setJoystickOffset({
      x: axisX * JOYSTICK_KNOB_RADIUS_PX,
      y: axisY * JOYSTICK_KNOB_RADIUS_PX
    });
  }

  function releaseJoystick(): void {
    joystickPointerId.current = null;
    setDirectionalAxes(0, 0);
    setJoystickOffset({ x: 0, y: 0 });
  }

  const joystickHandlers = {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      stopPointer(e);
      if (isPaused) return;
      joystickPointerId.current = e.pointerId;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateJoystick(e);
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (joystickPointerId.current !== e.pointerId) return;
      stopPointer(e);
      updateJoystick(e);
    },
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => {
      if (joystickPointerId.current !== e.pointerId) return;
      stopPointer(e);
      releaseJoystick();
    },
    onPointerCancel: (e: PointerEvent<HTMLDivElement>) => {
      if (joystickPointerId.current !== e.pointerId) return;
      stopPointer(e);
      releaseJoystick();
    },
    onPointerLeave: (e: PointerEvent<HTMLDivElement>) => {
      if (joystickPointerId.current !== e.pointerId) return;
      stopPointer(e);
      releaseJoystick();
    }
  };

  const jumpButtonHandlers = {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      stopPointer(e);
      if (!isPaused) bridgeActions.queueJump();
    }
  };

  const interactButtonHandlers = {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      stopPointer(e);
      if (!isPaused) bridgeActions.tapInteract();
    }
  };

  return {
    gestureHandlers,
    getDirectionalButtonHandlers,
    joystickHandlers,
    joystickOffset,
    jumpButtonHandlers,
    interactButtonHandlers
  };
}
