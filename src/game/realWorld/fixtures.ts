import { isPryable, PRYABLES, stepPry, type Fixture, type Opened, type Pry, type Pryable } from '@/game/core/realWorld';
import type { LabVent } from './buildVent';

/** Words the prompts and the touch button show, from the i18n messages. */
export interface PromptText {
  /** Under the crosshair, aiming at something loose / holding something (desktop). */
  promptPickUp: string;
  promptThrow: string;
  /** On the deck, holding something: throwing it is a distraction (desktop, then touch). */
  promptThrowNoise: string;
  promptThrowNoiseTouch: string;
  /** Under the crosshair, on a grate (desktop, then touch). */
  promptPry: string;
  promptPryTouch: string;
  /** Under the crosshair, on a sleeping drone (desktop, then touch). */
  promptWake: string;
  promptWakeTouch: string;
  /** Under the crosshair, on the lab door / the bolted grate / the service door / the armoury cage. */
  promptLocked: string;
  promptBolted: string;
  promptDronesOnly: string;
  promptCage: string;
  /** Touch button labels. */
  grab: string;
  throw: string;
  pry: string;
  wake: string;
}

/** What the crosshair offers. */
export type Prompt =
  | 'pickUp'
  | 'throw'
  | 'throwNoise'
  | 'pry'
  | 'wake'
  | 'locked'
  | 'bolted'
  | 'dronesOnly'
  | 'cage'
  | null;

/** Things worked by holding the action: the grates, and waking a drone. */
type Hold = Pryable | 'wake';

const FIXTURE_PROMPT: Readonly<Record<Fixture, Prompt>> = {
  grate: 'pry',
  dropGrate: 'pry',
  peekGrate: 'bolted',
  door: 'locked',
  serviceDoor: 'dronesOnly',
  cage: 'cage'
};

/** How long holding on a drone takes to wake it. */
const WAKE_SECONDS = 0.6;

/** What's under the crosshair this frame. */
export interface Aim {
  /** Loose things' prompt (hands free), if any; and whether one is held. */
  loose: Prompt;
  holdingLoose: boolean;
  fixture: Fixture | null;
  /** A sleeping drone's dock. */
  dock: number | null;
}

export interface Fixtures {
  /** Which grates are off and whether the service door is open. */
  readonly opened: Opened;
  /** The prompt showing now. */
  readonly prompt: Prompt;
  /** The touch action button (its press and release are wired by the caller). */
  readonly action: HTMLButtonElement;
  /** Show what the crosshair offers. */
  aim(aim: Aim): void;
  /** Pressing the action: true if it was taken (a hold started on a grate or a drone). */
  press(): boolean;
  letGo(): void;
  /** Work a held grate or drone along; show it give. */
  step(dt: number): void;
  /** The service door opened (a drone went through it). */
  openDoor(): void;
  dispose(): void;
}

export interface FixtureHooks {
  /** A drone woke on `dock`. */
  onWake(dock: number): void;
}

/**
 * The crosshair's prompt, the touch action button, and holding to work
 * things (#145): prying the vent's grates off, waking a cleaning drone.
 */
export function createFixtures(
  host: HTMLElement,
  text: PromptText,
  isTouch: boolean,
  vent: LabVent | null,
  hooks: FixtureHooks
): Fixtures {
  const prompt = document.createElement('p');
  prompt.className =
    'pointer-events-none absolute left-1/2 top-[calc(50%+22px)] hidden -translate-x-1/2 whitespace-nowrap text-xs text-white [text-shadow:0_1px_2px_#000]';
  // How far a hold has got, under the prompt.
  const bar = document.createElement('div');
  bar.className =
    'pointer-events-none absolute left-1/2 top-[calc(50%+42px)] hidden h-1.5 w-24 -translate-x-1/2 overflow-hidden rounded-full border border-[#0b0e1c] bg-white/30';
  const fill = document.createElement('div');
  fill.className = 'h-full origin-left bg-[#ffd36e]';
  fill.style.transform = 'scaleX(0)';
  bar.append(fill);
  const action = document.createElement('button');
  action.type = 'button';
  action.className =
    'absolute bottom-[max(5rem,env(safe-area-inset-bottom))] right-6 hidden h-20 w-20 rounded-full border-[3px] border-[#0b0e1c] bg-[#ff9fbf] text-sm font-bold uppercase text-[#0b0e1c]';
  host.append(prompt, bar, action);

  /**
   * Each prompt's words, and its touch button if it's something to do. On
   * touch the button says it all, unless there's no button or a hold needs
   * telling.
   */
  const words: Record<Exclude<Prompt, null> | 'none', { text: string; button: string; textOnTouch: boolean }> = {
    none: { text: '', button: '', textOnTouch: false },
    pickUp: { text: text.promptPickUp, button: text.grab, textOnTouch: false },
    throw: { text: text.promptThrow, button: text.throw, textOnTouch: false },
    throwNoise: {
      text: isTouch ? text.promptThrowNoiseTouch : text.promptThrowNoise,
      button: text.throw,
      textOnTouch: true
    },
    pry: { text: isTouch ? text.promptPryTouch : text.promptPry, button: text.pry, textOnTouch: true },
    wake: { text: isTouch ? text.promptWakeTouch : text.promptWake, button: text.wake, textOnTouch: true },
    locked: { text: text.promptLocked, button: '', textOnTouch: true },
    bolted: { text: text.promptBolted, button: '', textOnTouch: true },
    dronesOnly: { text: text.promptDronesOnly, button: '', textOnTouch: true },
    cage: { text: text.promptCage, button: '', textOnTouch: true }
  };

  const holds: Record<Hold, Pry> = {
    grate: { progress: 0, open: false },
    dropGrate: { progress: 0, open: false },
    wake: { progress: 0, open: false }
  };
  const opened = { grate: false, dropGrate: false, serviceDoor: false };
  let shown: Prompt = null;
  let aimed: Hold | null = null;
  let aimedDock: number | null = null;
  let holding: Hold | null = null;
  let holdingDock: number | null = null;

  const show = (next: Prompt) => {
    if (next === shown) return;
    shown = next;
    const entry = words[next ?? 'none'];
    prompt.textContent = entry.text;
    action.textContent = entry.button;
    prompt.classList.toggle('hidden', !entry.text || (isTouch && !entry.textOnTouch));
    action.classList.toggle('hidden', !isTouch || !entry.button);
    if (next !== 'pry' && next !== 'wake') holding = null;
  };

  /** Something worked loose: a grate comes off, or a drone wakes. */
  const done = (hold: Hold) => {
    holding = null;
    if (hold === 'wake') {
      if (holdingDock !== null) hooks.onWake(holdingDock);
      return;
    }
    opened[hold] = true;
    vent?.open(hold);
  };
  const stepHold = (hold: Hold, dt: number) => {
    const was = holds[hold].open;
    holds[hold] = stepPry(holds[hold], holding === hold, dt, hold === 'wake' ? WAKE_SECONDS : undefined);
    if (hold !== 'wake') vent?.setPry(hold, holds[hold].progress);
    if (holds[hold].open && !was) done(hold);
  };
  /** What the crosshair offers: loose things first, then a grate or a drone, then whatever else is there. */
  const choose = ({ loose, holdingLoose, fixture }: Aim, pry: Pryable | null): Prompt => {
    // Holding something up to a grate: prying wins (crawling in puts it down anyway).
    if (loose && !(holdingLoose && pry)) return loose;
    if (aimed === 'wake') return 'wake';
    return fixture ? FIXTURE_PROMPT[fixture] : null;
  };

  return {
    opened,
    get prompt() {
      return shown;
    },
    action,
    aim(next) {
      const pry = isPryable(next.fixture) ? next.fixture : null;
      aimedDock = next.dock;
      aimed = pry ?? (next.dock !== null && !holds.wake.open ? 'wake' : null);
      show(choose(next, pry));
    },
    press() {
      if (shown !== 'pry' && shown !== 'wake') return false;
      holding = aimed;
      holdingDock = aimedDock;
      return true;
    },
    letGo() {
      holding = null;
    },
    step(dt) {
      for (const hold of [...PRYABLES, 'wake'] as const) stepHold(hold, dt);
      const progress = aimed ? holds[aimed].progress : 0;
      bar.classList.toggle('hidden', progress <= 0 || progress >= 1);
      fill.style.transform = `scaleX(${progress})`;
    },
    openDoor() {
      opened.serviceDoor = true;
    },
    dispose() {
      prompt.remove();
      bar.remove();
      action.remove();
    }
  };
}
