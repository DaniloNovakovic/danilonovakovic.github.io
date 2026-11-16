// Command parsers are table-driven; remaining branching is intentional CLI surface area.
// fallow-ignore-file complexity
import type { BridgeBuildAction } from './bridgeBuilder';
import type { RidgeCommand, RidgeDuelAction, RidgeFacing, RidgeGigAction } from './types';

const HELP_TEXT = [
  'Ridge Console commands:',
  '  help                 show this help',
  '  look | status        describe surroundings / state',
  '  inventory            list carried items',
  '  go left|right [n]    walk along the stage (default 1 step)',
  '  interact [name]      talk/use nearest or named target',
  '  advance              continue conversation',
  '  choose <n|id>        pick a conversation reply',
  '  leave                exit conversation without finishing',
  '',
  'Bridge workbench (after the toy car test starts):',
  '  build road|wood X,Y X,Y   draw a beam between grid points',
  '                       (bolts at 0,0 8,0 0,2 8,2; y<0 is above the deck)',
  '  build erase <n>      remove beam #n (see build show)',
  '  build undo | clear | show | hint | sketch',
  '  build test           send the toy car across',
  '  build edit           back to drawing after a run',
  '  build done           celebrate a bridge that held',
  '',
  "Cicka's Standoff (keep the toy car and she tests you):",
  '  duel dodge           hop clear; time it to the paw landing',
  '  duel wait [n]        let n frames pass (default: until the next landing)',
  '  duel done            see how Cicka takes it once the standoff ends',
  '',
  'Concert gig (practice the riff with Dule, then play the show):',
  '  gig hit              strum the next note(s) exactly on time',
  '  gig hit 0|1|2        strum one lane right now (lanes: low, mid, high)',
  '  gig wait [ms]        let time pass (default: up to the next note)',
  '  gig auto | gig skip  play the rest perfectly | let the rest go by',
  '  gig done             take a bow once the song is over',
  '',
  'Playtest skips:',
  '  skip                 jump to the next area start',
  '  warp bridge|concert|dance|relay',
  '',
  'Script mode: separate commands with `;`',
  'Example: look; go right 3; interact; advance; advance'
].join('\n');

const SIMPLE_COMMANDS: Record<string, RidgeCommand> = {
  help: { type: 'help' },
  '?': { type: 'help' },
  h: { type: 'help' },
  look: { type: 'look' },
  l: { type: 'look' },
  status: { type: 'status' },
  stat: { type: 'status' },
  inventory: { type: 'inventory' },
  inv: { type: 'inventory' },
  i: { type: 'inventory' },
  advance: { type: 'advance' },
  continue: { type: 'advance' },
  n: { type: 'advance' },
  z: { type: 'advance' },
  leave: { type: 'leave' },
  back: { type: 'leave' },
  close: { type: 'leave' },
  skip: { type: 'skip' },
  next: { type: 'skip' }
};

const GO_ALIASES = new Set(['go', 'walk', 'move']);
const LEFT_ALIASES = new Set(['left', 'west', 'a']);
const RIGHT_ALIASES = new Set(['right', 'east', 'd']);
const INTERACT_ALIASES = new Set(['interact', 'talk', 'use', 'e', 'x']);
const CHOOSE_ALIASES = new Set(['choose', 'pick', 'select']);
const BUILD_ALIASES = new Set(['build', 'b']);
const DUEL_ALIASES = new Set(['duel', 'standoff']);
const DODGE_ALIASES = new Set(['dodge', 'jump', 'hop']);
const GIG_ALIASES = new Set(['gig', 'play', 'strum']);
const BUILD_SIMPLE: Record<string, BridgeBuildAction> = {
  undo: { kind: 'undo' },
  clear: { kind: 'clear' },
  show: { kind: 'show' },
  list: { kind: 'show' },
  hint: { kind: 'hint' },
  sketch: { kind: 'sketch' },
  trace: { kind: 'sketch' },
  test: { kind: 'test', instant: true },
  go: { kind: 'test', instant: true },
  edit: { kind: 'edit' },
  fix: { kind: 'edit' },
  retry: { kind: 'edit' },
  done: { kind: 'done' },
  leave: { kind: 'leave' }
};
const WARP_ALIASES = new Set(['warp', 'tp', 'goto', 'jump']);
const AREA_ALIASES: Record<string, import('./types').RidgeAreaId> = {
  bridge: 'bridge',
  concert: 'concert',
  dance: 'danceFestival',
  dancefestival: 'danceFestival',
  festival: 'danceFestival',
  relay: 'relay',
  ending: 'relay'
};

export function getRidgeHelpText(): string {
  return HELP_TEXT;
}

export function parseRidgeCommand(rawInput: string): RidgeCommand {
  const raw = rawInput.trim().replace(/\s+/g, ' ');
  if (!raw) return { type: 'unknown', raw: '' };

  const [head, ...args] = raw.toLowerCase().split(' ');
  if (!head) return { type: 'unknown', raw };

  const simple = SIMPLE_COMMANDS[head];
  if (simple) return simple;

  if (GO_ALIASES.has(head)) return parseGoCommand(raw, args);
  if (LEFT_ALIASES.has(head)) {
    return { type: 'go', direction: 'left', steps: parseOptionalSteps(args[0]) };
  }
  if (RIGHT_ALIASES.has(head)) {
    return { type: 'go', direction: 'right', steps: parseOptionalSteps(args[0]) };
  }
  if (INTERACT_ALIASES.has(head)) {
    return { type: 'interact', target: args.join(' ') || undefined };
  }
  if (CHOOSE_ALIASES.has(head)) {
    if (!args[0]) return { type: 'unknown', raw };
    return { type: 'choose', choiceIdOrIndex: args[0] };
  }
  if (BUILD_ALIASES.has(head)) {
    const action = parseBuildAction(args);
    return action ? { type: 'build', action } : { type: 'unknown', raw };
  }
  if (DODGE_ALIASES.has(head)) return { type: 'duel', action: { kind: 'dodge' } };
  if (DUEL_ALIASES.has(head)) {
    const action = parseDuelAction(args);
    return action ? { type: 'duel', action } : { type: 'unknown', raw };
  }
  if (GIG_ALIASES.has(head)) {
    const action = parseGigAction(head === 'strum' ? ['hit', ...args] : args);
    return action ? { type: 'gig', action } : { type: 'unknown', raw };
  }
  if (WARP_ALIASES.has(head)) {
    const areaId = args[0] ? AREA_ALIASES[args[0].replace(/[_-]/g, '')] : undefined;
    if (!areaId) return { type: 'unknown', raw };
    return { type: 'warp', areaId };
  }

  return { type: 'unknown', raw };
}

export function parseRidgeScript(script: string): RidgeCommand[] {
  return script
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map(parseRidgeCommand);
}

function parseGoCommand(raw: string, args: string[]): RidgeCommand {
  const direction = parseDirection(args[0]);
  if (!direction) return { type: 'unknown', raw };
  const steps = args[1] ? Number.parseFloat(args[1]) : 1;
  if (!Number.isFinite(steps) || steps <= 0) return { type: 'unknown', raw };
  return { type: 'go', direction, steps };
}

function parseDirection(value: string | undefined): RidgeFacing | null {
  if (!value) return null;
  if (value === 'left' || value === 'west' || value === 'a' || value === 'l') return 'left';
  if (value === 'right' || value === 'east' || value === 'd' || value === 'r') return 'right';
  return null;
}

function parseOptionalSteps(value: string | undefined): number {
  if (!value) return 1;
  const steps = Number.parseFloat(value);
  return Number.isFinite(steps) && steps > 0 ? steps : 1;
}

function parseBuildAction(args: string[]): BridgeBuildAction | null {
  const [verb, ...rest] = args;
  if (!verb) return { kind: 'show' };
  const simple = BUILD_SIMPLE[verb];
  if (simple) return simple;
  if (verb === 'erase' || verb === 'remove' || verb === 'rm') {
    const index = Number.parseInt(rest[0] ?? '', 10);
    return Number.isFinite(index) ? { kind: 'erase', index: index - 1 } : null;
  }
  if (verb === 'road' || verb === 'wood') {
    const a = parseGridPoint(rest[0]);
    const b = parseGridPoint(rest[1]);
    return a && b ? { kind: 'add', material: verb, a, b } : null;
  }
  return null;
}

function parseGridPoint(value: string | undefined): { x: number; y: number } | null {
  if (!value) return null;
  const match = /^(-?\d+),(-?\d+)$/.exec(value);
  if (!match) return null;
  return { x: Number(match[1]), y: Number(match[2]) };
}

function parseDuelAction(args: string[]): RidgeDuelAction | null {
  const [verb, count] = args;
  if (!verb || DODGE_ALIASES.has(verb)) return { kind: 'dodge' };
  if (verb === 'done' || verb === 'end') return { kind: 'done' };
  if (verb === 'wait' || verb === 'step') {
    if (!count) return { kind: 'wait' };
    const frames = Number.parseInt(count, 10);
    return Number.isFinite(frames) && frames > 0 ? { kind: 'wait', frames } : null;
  }
  return null;
}

function parseGigAction(args: string[]): RidgeGigAction | null {
  const [verb, value] = args;
  if (!verb || verb === 'hit' || verb === 'strum') {
    if (value === undefined) return { kind: 'hit' };
    return value === '0' || value === '1' || value === '2' ? { kind: 'hit', lane: Number(value) as 0 | 1 | 2 } : null;
  }
  if (verb === 'auto') return { kind: 'auto' };
  if (verb === 'skip') return { kind: 'skip' };
  if (verb === 'done' || verb === 'bow' || verb === 'end') return { kind: 'done' };
  if (verb === 'wait' || verb === 'step') {
    if (value === undefined) return { kind: 'wait' };
    const ms = Number.parseFloat(value);
    return Number.isFinite(ms) && ms > 0 ? { kind: 'wait', ms } : null;
  }
  return null;
}
