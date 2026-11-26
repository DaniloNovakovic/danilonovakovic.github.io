import { Color, Fog, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import {
  aimedFixture,
  crawlAmount,
  eyeHeightFor,
  LAB_ROOM,
  stepPry,
  stepWalker,
  type Pry,
  type View,
  type Walker
} from '@/game/core/realWorld';
import { buildLabRoom } from './buildLabRoom';
import { createInkPass } from './inkPass';
import { createThrowing } from './throwing';
import { makeToon, NIGHT_LAB } from './toon';

export interface RealWorldCallbacks {
  /** The game paused itself (lost pointer lock, `Esc`, tab hidden) or resumed. */
  onPausedChange(paused: boolean): void;
}

/** Words the real world shows, from the i18n messages. */
export interface RealWorldText {
  /** Under the crosshair, aiming at something loose (desktop). */
  promptPickUp: string;
  /** Under the crosshair, holding something (desktop). */
  promptThrow: string;
  /** Under the crosshair, on the vent grate (desktop, then touch). */
  promptPry: string;
  promptPryTouch: string;
  /** Under the crosshair, on the door / the far grate in the duct. */
  promptLocked: string;
  promptBolted: string;
  /** Touch button labels. */
  grab: string;
  throw: string;
  pry: string;
}

/** What the crosshair offers. */
type Prompt = 'pickUp' | 'throw' | 'pry' | 'locked' | 'bolted' | null;

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
/** Past this far down, hands are for crawling: no throwing. */
const CRAWL_HANDS = 0.2;
/** The lab's fog, standing and down in the duct, where the dark closes in. */
const FOG_STANDING = { near: 7, far: 26 };
const FOG_DUCT = { near: 1.5, far: 11 };

/**
 * The real world (ADR-0007): renders the lab room into `host` and drives
 * first-person walking. Everything it creates goes away with `dispose()`.
 */
export function bootRealWorld(host: HTMLElement, callbacks: RealWorldCallbacks, text: RealWorldText): RealWorldHandle {
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
  const prompt = document.createElement('p');
  prompt.className =
    'pointer-events-none absolute left-1/2 top-[calc(50%+22px)] hidden -translate-x-1/2 whitespace-nowrap text-xs text-white [text-shadow:0_1px_2px_#000]';
  // How far the grate has given, under the prompt.
  const pryBar = document.createElement('div');
  pryBar.className =
    'pointer-events-none absolute left-1/2 top-[calc(50%+42px)] hidden h-1.5 w-24 -translate-x-1/2 overflow-hidden rounded-full border border-[#0b0e1c] bg-white/30';
  const pryFill = document.createElement('div');
  pryFill.className = 'h-full origin-left bg-[#ffd36e]';
  pryFill.style.transform = 'scaleX(0)';
  pryBar.append(pryFill);
  const action = document.createElement('button');
  action.type = 'button';
  action.className =
    'absolute bottom-[max(5rem,env(safe-area-inset-bottom))] right-6 hidden h-20 w-20 rounded-full border-[3px] border-[#0b0e1c] bg-[#ff9fbf] text-sm font-bold uppercase text-[#0b0e1c]';
  host.append(stick, prompt, pryBar, action);

  const renderer = new WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new Scene();
  scene.background = new Color(NIGHT_LAB.background);
  // The far end of the lab sinks into the dark.
  scene.fog = new Fog(NIGHT_LAB.background, FOG_STANDING.near, FOG_STANDING.far);
  const camera = new PerspectiveCamera(75, 1, 0.05, 60);
  const yaw = new Object3D();
  const pitch = new Object3D();
  yaw.add(pitch);
  pitch.add(camera);
  scene.add(yaw);
  const room = buildLabRoom(LAB_ROOM, reducedMotion);
  scene.add(room.root);
  const throwing = createThrowing(room.root, LAB_ROOM, makeToon());
  const ink = createInkPass(renderer, camera, NIGHT_LAB.ink);
  const fog = scene.fog;

  const wakeSpot = LAB_ROOM.wake;
  let walker: Walker = { x: wakeSpot.x, z: wakeSpot.z, vx: 0, vz: 0 };
  // Facing the table and the monitors; the pods (and the others) are behind.
  yaw.rotation.y = wakeSpot.yaw;
  let wakeT = reducedMotion ? WAKE_SECONDS : 0;
  let pry: Pry = { progress: 0, open: false };
  let crawl = 0;
  let shown: Prompt = null;
  /** Click, E or the touch button held down on the grate. */
  let prying = false;

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
    prying = false;
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

  const view = (): View => ({
    x: walker.x,
    y: yaw.position.y,
    z: walker.z,
    yaw: yaw.rotation.y,
    pitch: pitch.rotation.x + camera.rotation.x
  });
  /** Pressing the action: `gentle` is E, which puts a held thing down instead of throwing it. */
  const press = (gentle: boolean) => {
    if (crawl > CRAWL_HANDS) return;
    if (shown === 'pry') prying = true;
    else if (gentle) throwing.drop(view());
    else throwing.act(view());
  };
  const letGo = () => (prying = false);
  on<KeyboardEvent>(window, 'keydown', (event) => {
    if (event.key === 'Escape' && isTouch) setPaused(true);
    if (paused) return;
    keys.add(event.code);
    if (event.code === 'KeyE' && !event.repeat) press(true);
  });
  on<KeyboardEvent>(window, 'keyup', (event) => {
    keys.delete(event.code);
    if (event.code === 'KeyE') letGo();
  });
  on(window, 'blur', () => {
    keys.clear();
    letGo();
  });
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
    if (isTouch || paused || event.button !== 0) return;
    if (document.pointerLockElement === canvas) press(false);
    else lockPointer();
  });
  on<MouseEvent>(window, 'mouseup', (event) => {
    if (event.button === 0) letGo();
  });
  on<PointerEvent>(action, 'pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!paused) press(false);
  });
  on(action, 'pointerup', letGo);
  on(action, 'pointercancel', letGo);
  on(action, 'pointerleave', letGo);
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

  /**
   * Each prompt's words, and its touch button if it's something to do. On
   * touch the button says it all, unless there's no button or prying needs
   * telling to hold.
   */
  const prompts: Record<Exclude<Prompt, null> | 'none', { text: string; button: string; textOnTouch: boolean }> = {
    none: { text: '', button: '', textOnTouch: false },
    pickUp: { text: text.promptPickUp, button: text.grab, textOnTouch: false },
    throw: { text: text.promptThrow, button: text.throw, textOnTouch: false },
    pry: { text: isTouch ? text.promptPryTouch : text.promptPry, button: text.pry, textOnTouch: true },
    locked: { text: text.promptLocked, button: '', textOnTouch: true },
    bolted: { text: text.promptBolted, button: '', textOnTouch: true }
  };
  const showPrompt = (next: Prompt) => {
    if (next === shown) return;
    shown = next;
    const entry = prompts[next ?? 'none'];
    prompt.textContent = entry.text;
    action.textContent = entry.button;
    prompt.classList.toggle('hidden', !entry.text || (isTouch && !entry.textOnTouch));
    action.classList.toggle('hidden', !isTouch || !entry.button);
    prying &&= next === 'pry';
  };
  /** What the crosshair offers right now: loose things first, then fixtures; nothing for the hands in the duct. */
  const choosePrompt = (): Prompt => {
    const fixture = aimedFixture(LAB_ROOM, view(), pry.open);
    if (crawl > CRAWL_HANDS) return fixture === 'farGrate' ? 'bolted' : null;
    if (throwing.prompt) return throwing.prompt;
    if (fixture === 'grate') return 'pry';
    if (fixture === 'door') return 'locked';
    return fixture === 'farGrate' ? 'bolted' : null;
  };

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
        dt,
        pry.open
      );
      crawl = crawlAmount(LAB_ROOM.vent, pry.open, walker.x, walker.z);
      // Waking: from slumped low and looking down, up to standing (or ducking into the vent).
      const ease = 1 - (1 - awake) ** 3;
      yaw.position.set(walker.x, 0.7 + (eyeHeightFor(LAB_ROOM.vent, crawl) - 0.7) * ease, walker.z);
      camera.rotation.x = -(1 - ease) * 0.9;
      if (fog instanceof Fog) {
        fog.near = FOG_STANDING.near + (FOG_DUCT.near - FOG_STANDING.near) * crawl;
        fog.far = FOG_STANDING.far + (FOG_DUCT.far - FOG_STANDING.far) * crawl;
      }
      const wasOpen = pry.open;
      pry = stepPry(pry, prying, dt);
      room.vent?.setPry(pry.progress);
      if (pry.open && !wasOpen) {
        room.vent?.open();
        prying = false;
      }
      pryBar.classList.toggle('hidden', pry.open || pry.progress <= 0);
      pryFill.style.transform = `scaleX(${pry.progress})`;
      room.update(now / 1000);
      scene.updateMatrixWorld();
      throwing.update(dt, view(), camera);
      showPrompt(choosePrompt());
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
      prompt.remove();
      pryBar.remove();
      action.remove();
    }
  };
}
