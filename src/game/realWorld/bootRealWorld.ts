import { Color, Fog, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import {
  aimedFixture,
  eyeOf,
  LAB_ROOM,
  isPryable,
  PRYABLES,
  startExplorer,
  startGlimpse,
  stepExplorer,
  stepGlimpse,
  stepPry,
  STOREROOM,
  toRoom,
  type Explorer,
  type Fixture,
  type Pry,
  type Pryable,
  type View
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

/** Where a held thing is let go of at the vent's mouth: about hand height on hands and knees. */
const PUT_DOWN_HEIGHT = 0.4;

/** What each fixture offers under the crosshair. */
const FIXTURE_PROMPT: Readonly<Record<Fixture, Prompt>> = {
  grate: 'pry',
  dropGrate: 'pry',
  peekGrate: 'bolted',
  door: 'locked'
};

/**
 * The real world (ADR-0007): renders the lab and the storeroom under its vent
 * into `host` and drives first-person walking, crawling and dropping between
 * them. Everything it creates goes away with `dispose()`.
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
  const fog = new Fog(NIGHT_LAB.background, FOG_STANDING.near, FOG_STANDING.far);
  scene.fog = fog;
  const camera = new PerspectiveCamera(75, 1, 0.05, 60);
  const yaw = new Object3D();
  const pitch = new Object3D();
  yaw.add(pitch);
  pitch.add(camera);
  scene.add(yaw);
  const room = buildLabRoom(LAB_ROOM, reducedMotion);
  const storeroom = buildLabRoom(STOREROOM, reducedMotion, { lights: false });
  scene.add(room.root, storeroom.root);
  // Loose things stay in the lab: you need both hands to crawl.
  const throwing = createThrowing(room.root, LAB_ROOM, makeToon());
  const ink = createInkPass(renderer, camera, NIGHT_LAB.ink);

  let explorer: Explorer = startExplorer(LAB_ROOM);
  // The researcher below the bolted grate waits until Danilo is in the duct.
  let glimpse = startGlimpse();
  // Facing the table and the monitors; the pods (and the others) are behind.
  yaw.rotation.y = LAB_ROOM.wake.yaw;
  let wakeT = reducedMotion ? WAKE_SECONDS : 0;
  const pries: Record<Pryable, Pry> = {
    grate: { progress: 0, open: false },
    dropGrate: { progress: 0, open: false }
  };
  /** Which grates are off: changed only when one comes off. */
  const opened: Record<Pryable, boolean> = { grate: false, dropGrate: false };
  let shown: Prompt = null;
  /** The grate under the crosshair, if any, and the one click, E or the touch button is holding on. */
  let aimedPry: Pryable | null = null;
  let prying: Pryable | null = null;

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
    prying = null;
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

  /** The eye, in the world. */
  const view = (): View => ({
    x: yaw.position.x,
    y: yaw.position.y,
    z: yaw.position.z,
    yaw: yaw.rotation.y,
    pitch: pitch.rotation.x + camera.rotation.x
  });
  /** Hands free for loose things: in the lab, standing. */
  const handsFree = () => explorer.room === LAB_ROOM && explorer.crawl <= CRAWL_HANDS && !explorer.fall;
  /** Pressing the action: `gentle` is E, which puts a held thing down instead of throwing it. */
  const press = (gentle: boolean) => {
    if (shown === 'pry') prying = aimedPry;
    else if (!handsFree()) return;
    else if (gentle) throwing.drop(view());
    else throwing.act(view());
  };
  const letGo = () => (prying = null);
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
    if (next !== 'pry') prying = null;
  };
  /** What the crosshair offers right now: loose things first (hands free), then fixtures. */
  const choosePrompt = (): Prompt => {
    const fixture = explorer.fall ? null : aimedFixture(explorer.room, toRoom(explorer.room, view()), opened);
    aimedPry = isPryable(fixture) ? fixture : null;
    // Holding something up to a grate: prying wins (crawling in puts it down anyway).
    if (handsFree() && throwing.prompt && !(throwing.holding && aimedPry)) return throwing.prompt;
    return fixture ? FIXTURE_PROMPT[fixture] : null;
  };
  /** Work a held grate loose; when one comes off, show it go. */
  const stepGrates = (dt: number) => {
    for (const grate of PRYABLES) {
      const was = pries[grate].open;
      pries[grate] = stepPry(pries[grate], prying === grate, dt);
      room.vent?.setPry(grate, pries[grate].progress);
      if (pries[grate].open && !was) {
        opened[grate] = true;
        room.vent?.open(grate);
        prying = null;
      }
    }
    const progress = aimedPry ? pries[aimedPry].progress : 0;
    pryBar.classList.toggle('hidden', progress <= 0 || progress >= 1);
    pryFill.style.transform = `scaleX(${progress})`;
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
      const wasIn = explorer.room;
      explorer = stepExplorer(
        explorer,
        {
          forward: canWalk ? axis(['KeyW', 'ArrowUp'], ['KeyS', 'ArrowDown']) - touchStick.y : 0,
          strafe: canWalk ? axis(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']) + touchStick.x : 0,
          yaw: yaw.rotation.y
        },
        dt,
        opened
      );
      if (explorer.room !== wasIn) {
        // Dropped into the room below, still facing the way you crawled; no fall under reduced motion.
        if (reducedMotion) explorer = { ...explorer, fall: null };
      }
      const { crawl } = explorer;
      const eye = eyeOf(explorer);
      // Waking: from slumped low and looking down, up to standing.
      const ease = 1 - (1 - awake) ** 3;
      yaw.position.set(eye.x, 0.7 + (eye.y - 0.7) * ease, eye.z);
      camera.rotation.x = -(1 - ease) * 0.9;
      fog.near = FOG_STANDING.near + (FOG_DUCT.near - FOG_STANDING.near) * crawl;
      fog.far = FOG_STANDING.far + (FOG_DUCT.far - FOG_STANDING.far) * crawl;
      // Both hands to crawl: whatever was held is set down at the vent's mouth.
      if (crawl > CRAWL_HANDS && throwing.holding) throwing.putDown({ ...eye, y: PUT_DOWN_HEIGHT });
      stepGrates(dt);
      glimpse = stepGlimpse(glimpse, explorer, dt);
      room.vent?.showGlimpse(glimpse);
      room.update(now / 1000);
      storeroom.update(now / 1000);
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
      storeroom.dispose();
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
