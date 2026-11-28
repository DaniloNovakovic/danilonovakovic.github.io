import { Color, Fog, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import {
  aimedDock,
  aimedFixture,
  DECK_ESCAPE,
  DECK_THROWABLES,
  eyeOf,
  LAB_ROOM,
  LAB_THROWABLES,
  retry,
  SHIP_DECK,
  startEscape,
  startExplorer,
  startGlimpse,
  stepEscape,
  stepExplorer,
  stepGlimpse,
  toRoom,
  wakeDrone,
  type Escape,
  type Explorer,
  type Noise,
  type View
} from '@/game/core/realWorld';
import { buildRoom } from './buildRoom';
import { createDeckActors } from './deckActors';
import { createFixtures, type PromptText } from './fixtures';
import { createInkPass } from './inkPass';
import { createThrowing } from './throwing';
import { makeToon, NIGHT_LAB } from './toon';

export interface RealWorldCallbacks {
  /** The game paused itself (lost pointer lock, `Esc`, tab hidden) or resumed. */
  onPausedChange(paused: boolean): void;
  /** An alien caught Danilo: everything holds still until `retry()`. */
  onCaught(): void;
  /** Danilo reached the armoury cage: the end of this stretch. */
  onReached(): void;
}

/** Words the real world shows, from the i18n messages. */
export type RealWorldText = PromptText;

export interface RealWorldHandle {
  /** Call from a click: unpauses and takes pointer lock back (desktop). */
  resume(): void;
  /** Call from a click after being caught: back to the latest checkpoint, the aliens back on their rounds. */
  retry(): void;
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

/**
 * The real world (ADR-0007): renders the lab and the ship deck under its vent
 * into `host` and drives first-person walking, crawling, dropping between
 * them, and sneaking across the deck. Everything it creates goes away with
 * `dispose()`.
 */
export interface RealWorldOptions {
  /** Dev only: wake up on the ship deck, in the storeroom, skipping the lab and the vent. */
  start?: 'lab' | 'deck';
}

export function bootRealWorld(
  host: HTMLElement,
  callbacks: RealWorldCallbacks,
  text: RealWorldText,
  options: RealWorldOptions = {}
): RealWorldHandle {
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
  // The far end of the lab sinks into the dark.
  const fog = new Fog(NIGHT_LAB.background, FOG_STANDING.near, FOG_STANDING.far);
  scene.fog = fog;
  const camera = new PerspectiveCamera(75, 1, 0.05, 60);
  const yaw = new Object3D();
  const pitch = new Object3D();
  yaw.add(pitch);
  pitch.add(camera);
  scene.add(yaw);
  const lab = buildRoom(LAB_ROOM, reducedMotion);
  const deck = buildRoom(SHIP_DECK, reducedMotion, { lights: false });
  scene.add(lab.root, deck.root);
  // Loose things stay in their room: you need both hands to crawl.
  const toon = makeToon();
  const labThings = createThrowing(lab.root, LAB_ROOM, toon, LAB_THROWABLES);
  const deckThings = createThrowing(deck.root, SHIP_DECK, toon, DECK_THROWABLES);
  /** What landed with a clatter last frame, on the deck: the aliens hear it this one. */
  let noises: Noise[] = [];
  const actors = createDeckActors(deck, DECK_ESCAPE, host);
  const ink = createInkPass(renderer, camera, NIGHT_LAB.ink);

  const startRoom = options.start === 'deck' ? SHIP_DECK : LAB_ROOM;
  let explorer: Explorer = startExplorer(startRoom);
  // The researcher below the bolted grate waits until Danilo is in the duct.
  let glimpse = startGlimpse();
  let escape: Escape = startEscape(DECK_ESCAPE);
  const fixtures = createFixtures(host, text, isTouch, lab.vent, {
    onWake(dock) {
      escape = wakeDrone(DECK_ESCAPE, escape, dock);
      actors.wakeDrone(dock);
    }
  });
  // Facing the table and the monitors; the pods (and the others) are behind.
  yaw.rotation.y = startRoom.wake.yaw;
  let wakeT = reducedMotion ? WAKE_SECONDS : 0;
  /** Caught or at the cage: the game holds still behind a card until a click. */
  let stopped: 'caught' | 'reached' | null = null;

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

  const releaseInput = () => {
    keys.clear();
    releaseStick();
    lookId = -1;
    fixtures.letGo();
  };
  const setPaused = (next: boolean) => {
    if (paused === next || stopped) return;
    paused = next;
    releaseInput();
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
  /** Caught, or at the cage: hold still and hand the pointer back for the card's button. */
  const stop = (why: 'caught' | 'reached') => {
    stopped = why;
    releaseInput();
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    if (why === 'caught') callbacks.onCaught();
    else callbacks.onReached();
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
  const onDeck = () => explorer.room === SHIP_DECK;
  /** The eye, in the room's own coordinates. */
  const localView = () => toRoom(explorer.room, view());
  /** The loose things in the room you're in. */
  const throwing = () => (onDeck() ? deckThings : labThings);
  /** Hands free for loose things: standing, not falling. */
  const handsFree = () => explorer.crawl <= CRAWL_HANDS && !explorer.fall;
  /** Pressing the action: `gentle` is E, which puts a held thing down instead of throwing it. */
  const press = (gentle: boolean) => {
    if (stopped || fixtures.press() || !handsFree()) return;
    if (gentle) throwing().drop(localView());
    else throwing().act(localView());
  };
  const letGo = () => fixtures.letGo();
  on<KeyboardEvent>(window, 'keydown', (event) => {
    if (event.key === 'Escape' && isTouch) setPaused(true);
    if (paused || stopped) return;
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
    if (isTouch || paused || stopped || event.button !== 0) return;
    if (document.pointerLockElement === canvas) press(false);
    else lockPointer();
  });
  on<MouseEvent>(window, 'mouseup', (event) => {
    if (event.button === 0) letGo();
  });
  const { action } = fixtures;
  on<PointerEvent>(action, 'pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!paused) press(false);
  });
  on(action, 'pointerup', letGo);
  on(action, 'pointercancel', letGo);
  on(action, 'pointerleave', letGo);
  on<PointerEvent>(canvas, 'pointerdown', (event) => {
    if (paused || stopped || event.pointerType !== 'touch') return;
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

  /** What the crosshair rests on: loose things first (hands free), then fixtures and sleeping drones. */
  const aim = () => {
    const standing = !explorer.fall && !stopped;
    const local = localView();
    const { prompt, holding } = throwing();
    fixtures.aim({
      // On the deck, a throw is a distraction: the prompt says so.
      loose: handsFree() ? (prompt === 'throw' && onDeck() ? 'throwNoise' : prompt) : null,
      holdingLoose: holding,
      fixture: standing ? aimedFixture(explorer.room, local, fixtures.opened) : null,
      dock: standing && onDeck() ? aimedDock(DECK_ESCAPE, escape, local) : null
    });
  };

  /** The deck's aliens and drones: watching for Danilo once he's down there, or the glimpse from the duct. */
  const stepDeck = (dt: number, seconds: number) => {
    if (!onDeck()) {
      glimpse = stepGlimpse(glimpse, explorer, dt);
      actors.showGlimpse(glimpse, seconds);
      return;
    }
    if (!stopped) sneak(dt);
    actors.show(escape, explorer.walker, seconds, dt);
  };
  /** One frame of the escape across the deck: the door opening, being caught, reaching the cage. */
  const sneak = (dt: number) => {
    escape = stepEscape(DECK_ESCAPE, escape, explorer.fall ? null : explorer.walker, dt, noises);
    for (const noise of noises) actors.showNoise(noise);
    noises = [];
    if (escape.doorOpen && !fixtures.opened.serviceDoor) fixtures.openDoor();
    if (escape.caught) stop('caught');
    else if (escape.reached) stop('reached');
  };

  /** The loose things in the room you're in; on the deck, what clatters down is heard next frame. */
  const stepLoose = (dt: number) => {
    const landed = throwing().update(dt, localView(), camera);
    if (onDeck() && !stopped) noises.push(...landed);
  };

  // ---- loop ----
  const axis = (plus: string[], minus: string[]) =>
    (plus.some((code) => keys.has(code)) ? 1 : 0) - (minus.some((code) => keys.has(code)) ? 1 : 0);
  let frame = 0;
  let last = performance.now();
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    // The first frame's timestamp can come before the one taken at boot: never step backwards.
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    if (!paused) {
      wakeT = Math.min(WAKE_SECONDS, wakeT + dt);
      const awake = wakeT / WAKE_SECONDS;
      yaw.rotation.y -= look.dx;
      pitch.rotation.x = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch.rotation.x - look.dy));
      const canWalk = awake > 0.6 && !stopped;
      const wasIn = explorer.room;
      explorer = stepExplorer(
        explorer,
        {
          forward: canWalk ? axis(['KeyW', 'ArrowUp'], ['KeyS', 'ArrowDown']) - touchStick.y : 0,
          strafe: canWalk ? axis(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']) + touchStick.x : 0,
          yaw: yaw.rotation.y
        },
        dt,
        fixtures.opened
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
      if (crawl > CRAWL_HANDS && labThings.holding) labThings.putDown({ ...eye, y: PUT_DOWN_HEIGHT });
      fixtures.step(dt);
      const seconds = now / 1000;
      stepDeck(dt, seconds);
      lab.update(seconds);
      deck.update(seconds);
      scene.updateMatrixWorld();
      stepLoose(dt);
      aim();
      actors.project(camera, host.clientWidth, host.clientHeight);
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
    retry() {
      if (stopped !== 'caught') return;
      const again = retry(DECK_ESCAPE, escape);
      escape = again.escape;
      // Back at the checkpoint, still facing the way you were: no turning the camera for you.
      explorer = { ...explorer, walker: { x: again.spawn.x, z: again.spawn.z, vx: 0, vz: 0 }, fall: null };
      stopped = null;
      lockPointer();
    },
    dispose() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      for (const [target, type, handler] of listeners) target.removeEventListener(type, handler);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      lab.dispose();
      deck.dispose();
      actors.dispose();
      fixtures.dispose();
      ink.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      stick.remove();
    }
  };
}
