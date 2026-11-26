import { Color, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { findCells, LAB_ROOM, REAL_WORLD_EYE_HEIGHT, stepWalker, type Walker } from '@/game/core/realWorld';
import { buildLabRoom, NIGHT_LAB } from './buildLabRoom';
import { createInkPass } from './inkPass';

export interface RealWorldCallbacks {
  /** The game paused itself (lost pointer lock, `Esc`, tab hidden) or resumed. */
  onPausedChange(paused: boolean): void;
}

export interface RealWorldHandle {
  /** Call from a click: unpauses and takes pointer lock back (desktop). */
  resume(): void;
  /** Frees the WebGL context and every listener. */
  dispose(): void;
}

const MOUSE_LOOK = 0.0022;
const TOUCH_LOOK = 0.006;
const STICK_REACH_PX = 50;
const MAX_PITCH = 1.3;
/** Waking up: the view lifts from the floor to eye level. */
const WAKE_SECONDS = 2.2;

/**
 * The real world (ADR-0007): renders the lab room into `host` and drives
 * first-person walking. Everything it creates goes away with `dispose()`.
 */
export function bootRealWorld(host: HTMLElement, callbacks: RealWorldCallbacks): RealWorldHandle {
  const isTouch = matchMedia('(pointer: coarse)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'block h-full w-full touch-none';
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);
  const stick = document.createElement('div');
  stick.className =
    'pointer-events-none fixed hidden h-[110px] w-[110px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70';
  const knob = document.createElement('div');
  knob.className = 'absolute left-[35px] top-[35px] h-10 w-10 rounded-full bg-white/70';
  stick.append(knob);
  host.append(stick);

  const renderer = new WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new Scene();
  scene.background = new Color(NIGHT_LAB.background);
  const camera = new PerspectiveCamera(75, 1, 0.05, 60);
  const yaw = new Object3D();
  const pitch = new Object3D();
  yaw.add(pitch);
  pitch.add(camera);
  scene.add(yaw);
  const room = buildLabRoom(LAB_ROOM);
  scene.add(room.root);
  const ink = createInkPass(renderer, camera, NIGHT_LAB.ink);

  const [wakeSpot] = findCells(LAB_ROOM, 'P');
  let walker: Walker = { x: wakeSpot.x, z: wakeSpot.z, vx: 0, vz: 0 };
  // Facing into the room, away from the pod and the wall behind it.
  yaw.rotation.y = -Math.PI * 0.6;
  let wakeT = reducedMotion ? WAKE_SECONDS : 0;

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = host;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    ink.resize();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  // ---- input ----
  let paused = false;
  const keys = new Set<string>();
  const look = { dx: 0, dy: 0 };
  const touchStick = { id: -1, ox: 0, oy: 0, x: 0, y: 0 };
  let lookId = -1;
  let lastLook = { x: 0, y: 0 };

  const setPaused = (next: boolean) => {
    if (paused === next) return;
    paused = next;
    keys.clear();
    releaseStick();
    lookId = -1;
    callbacks.onPausedChange(next);
  };
  const lockPointer = () => {
    if (isTouch || document.pointerLockElement === canvas) return;
    try {
      const pending = canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      pending?.catch?.(() => setPaused(true));
    } catch {
      setPaused(true);
    }
  };
  const releaseStick = () => {
    touchStick.id = -1;
    touchStick.x = touchStick.y = 0;
    stick.classList.add('hidden');
    knob.style.transform = '';
  };

  const listeners: Array<[EventTarget, string, EventListener]> = [];
  const on = <E extends Event>(target: EventTarget, type: string, handler: (event: E) => void) => {
    target.addEventListener(type, handler as EventListener);
    listeners.push([target, type, handler as EventListener]);
  };

  on<KeyboardEvent>(window, 'keydown', (event) => {
    if (event.key === 'Escape' && isTouch) setPaused(true);
    if (!paused) keys.add(event.code);
  });
  on<KeyboardEvent>(window, 'keyup', (event) => keys.delete(event.code));
  on(window, 'blur', () => keys.clear());
  on(document, 'visibilitychange', () => {
    if (document.hidden) setPaused(true);
  });
  on(document, 'pointerlockchange', () => {
    if (!isTouch && document.pointerLockElement !== canvas) setPaused(true);
  });
  on(document, 'pointerlockerror', () => setPaused(true));
  on<MouseEvent>(document, 'mousemove', (event) => {
    if (document.pointerLockElement !== canvas) return;
    look.dx += event.movementX * MOUSE_LOOK;
    look.dy += event.movementY * MOUSE_LOOK;
  });
  on<MouseEvent>(canvas, 'mousedown', (event) => {
    if (!isTouch && !paused && event.button === 0) lockPointer();
  });
  on<PointerEvent>(canvas, 'pointerdown', (event) => {
    if (paused || event.pointerType !== 'touch') return;
    if (event.clientX < host.clientWidth / 2 && touchStick.id === -1) {
      Object.assign(touchStick, { id: event.pointerId, ox: event.clientX, oy: event.clientY, x: 0, y: 0 });
      stick.style.left = `${event.clientX}px`;
      stick.style.top = `${event.clientY}px`;
      stick.classList.remove('hidden');
    } else if (lookId === -1) {
      lookId = event.pointerId;
      lastLook = { x: event.clientX, y: event.clientY };
    }
  });
  on<PointerEvent>(canvas, 'pointermove', (event) => {
    if (event.pointerId === touchStick.id) {
      let x = event.clientX - touchStick.ox;
      let y = event.clientY - touchStick.oy;
      const length = Math.hypot(x, y);
      if (length > STICK_REACH_PX) {
        x = (x / length) * STICK_REACH_PX;
        y = (y / length) * STICK_REACH_PX;
      }
      touchStick.x = x / STICK_REACH_PX;
      touchStick.y = y / STICK_REACH_PX;
      knob.style.transform = `translate(${x}px, ${y}px)`;
    } else if (event.pointerId === lookId) {
      look.dx += (event.clientX - lastLook.x) * TOUCH_LOOK;
      look.dy += (event.clientY - lastLook.y) * TOUCH_LOOK;
      lastLook = { x: event.clientX, y: event.clientY };
    }
  });
  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerId === touchStick.id) releaseStick();
    if (event.pointerId === lookId) lookId = -1;
  };
  on(canvas, 'pointerup', onPointerUp);
  on(canvas, 'pointercancel', onPointerUp);

  // ---- loop ----
  const axis = (plus: string[], minus: string[]) =>
    (plus.some((code) => keys.has(code)) ? 1 : 0) - (minus.some((code) => keys.has(code)) ? 1 : 0);
  let frame = 0;
  let last = performance.now();
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!paused) {
      wakeT = Math.min(WAKE_SECONDS, wakeT + dt);
      const awake = wakeT / WAKE_SECONDS;
      yaw.rotation.y -= look.dx;
      pitch.rotation.x = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch.rotation.x - look.dy));
      const canWalk = awake > 0.6;
      walker = stepWalker(
        LAB_ROOM,
        walker,
        {
          forward: canWalk ? axis(['KeyW', 'ArrowUp'], ['KeyS', 'ArrowDown']) - touchStick.y : 0,
          strafe: canWalk ? axis(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']) + touchStick.x : 0,
          yaw: yaw.rotation.y
        },
        dt
      );
      // Waking: from slumped low and looking down, up to standing.
      const ease = 1 - (1 - awake) ** 3;
      yaw.position.set(walker.x, 0.7 + (REAL_WORLD_EYE_HEIGHT - 0.7) * ease, walker.z);
      camera.rotation.x = -(1 - ease) * 0.9;
    }
    look.dx = look.dy = 0;
    ink.render(scene, camera);
  };
  frame = requestAnimationFrame(tick);
  lockPointer();

  return {
    resume() {
      setPaused(false);
      lockPointer();
    },
    dispose() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      for (const [target, type, handler] of listeners) target.removeEventListener(type, handler);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      room.dispose();
      ink.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      stick.remove();
    }
  };
}
