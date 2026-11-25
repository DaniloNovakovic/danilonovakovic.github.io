// Command parsers are table-driven; remaining branching is intentional CLI surface area.
// fallow-ignore-file complexity
import { CIRCUIT_PART_IDS } from './content/circuitParts';
import { DEBUGGING_TOOLS_ITEM_ID } from './content/outOfBoundsVoid';
import type { GameCommand, GameFacing, GameItemId } from './types';

const ITEM_IDS = new Set<GameItemId>(['glasses', 'circuit', ...CIRCUIT_PART_IDS, DEBUGGING_TOOLS_ITEM_ID]);

const SIMPLE_COMMANDS: Record<string, GameCommand> = {
  help: { type: 'help' },
  '?': { type: 'help' },
  status: { type: 'status' },
  inventory: { type: 'inventory' },
  inv: { type: 'inventory' },
  i: { type: 'inventory' },
  close: { type: 'close' },
  back: { type: 'close' },
  leave: { type: 'leave' },
  advance: { type: 'advance' },
  z: { type: 'advance' },
  continue: { type: 'advance' },
  start: { type: 'start' },
  perform: { type: 'perform' },
  confirm: { type: 'confirm' },
  yes: { type: 'confirm' },
  y: { type: 'confirm' },
  decline: { type: 'decline' },
  no: { type: 'decline' },
  n: { type: 'decline' },
  play: { type: 'perform' },
  fight: { type: 'fight' },
  clear: { type: 'fight' },
  skip: { type: 'skip' },
  next: { type: 'skip' }
};

const GO_ALIASES = new Set(['go', 'walk', 'move']);
/** Ridge mini-game verbs the Ridge console parses itself. */
const RIDGE_VERBS = new Set(['build', 'duel', 'dodge', 'gig', 'strum']);
const LEFT_ALIASES = new Set(['left', 'l']);
const RIGHT_ALIASES = new Set(['right', 'r']);
const INTERACT_ALIASES = new Set(['interact', 'use', 'talk']);

export function getGameHelpText(): string {
  return [
    'Game Console — full headless play (Overworld → Basement → Scrub Rumble → Ridge)',
    '',
    'Shared:',
    '  help | look | status | inventory',
    '  go left|right [n]   (also: left/right/l/r [n])',
    '  interact [name]     nearest prompt wins if name omitted',
    '  equip <item> | unequip <item>   items: glasses, circuit',
    '  close | leave | back            close overlay / leave room / leave talk',
    '',
    'Hobbies room:',
    '  perform | play      clear the open mini-game goal (music/fitness/dancing award Circuit parts)',
    '  confirm | decline   answer the point-of-no-return warning at the toolbox',
    '',
    'Ridge conversation:',
    '  advance | choose <id|index>',
    '',
    'Ridge Blueprint Bridge (after the toy car test starts):',
    '  build road|wood X,Y X,Y | build test | build edit | build done',
    '  build sketch | hint | undo | erase <n> | show | leave',
    '',
    "Ridge Cicka's Standoff: duel dodge | duel wait [frames] | duel done",
    'Ridge Concert gig: gig hit [0|1|2] | gig wait [ms] | gig auto | gig skip | gig done',
    '',
    'Ridge playtest skips:',
    '  skip                         next area',
    '  warp bridge|concert|dance|relay',
    '',
    'Scrub Rumble (code id potassium, discrete campaign):',
    '  start | fight | draft <id|index>',
    '',
    'AI cheats:',
    '  cheat give glasses|circuit|copper-string|clock-crystal|battery-cell|debugging-tools',
    '',
    'Scripts: separate commands with ;',
    'Example smoke:',
    '  go right 3; interact; go right 12; interact; close;',
    '  go right 10; equip glasses; interact; interact;',
    '  start; fight; fight; fight; draft 1; fight; fight;',
    '  go right 25; interact'
  ].join('\n');
}

export function parseGameCommand(raw: string): GameCommand {
  const trimmed = raw.trim();
  if (!trimmed) return { type: 'unknown', raw: '' };

  const lower = trimmed.toLowerCase();
  const parts = lower.split(/\s+/);
  const head = parts[0] ?? '';

  // `l` alone is look; `l 2` is go left 2.
  if (head === 'look' || (head === 'l' && parts.length === 1)) {
    return { type: 'look' };
  }

  // Before SIMPLE_COMMANDS: `build clear` must not read as the Potassium `clear`,
  // nor `gig skip` as the Ridge area skip.
  if (RIDGE_VERBS.has(head)) return { type: 'ridgeVerb', raw: trimmed };

  const simple = SIMPLE_COMMANDS[head];
  if (simple) return simple;

  if (head === 'choose') return parseChoiceCommand('choose', parts, trimmed);
  if (head === 'draft') return parseChoiceCommand('draft', parts, trimmed);
  if (head === 'equip' || head === 'unequip') return parseEquipCommand(head, parts, trimmed);
  if (head === 'cheat') return parseCheatCommand(parts, trimmed);
  if (head === 'warp' || head === 'tp' || head === 'goto' || head === 'jump') {
    const areaId = parts[1];
    if (!areaId) return { type: 'unknown', raw: trimmed };
    return { type: 'warp', areaId };
  }
  if (INTERACT_ALIASES.has(head)) {
    return { type: 'interact', target: parts.slice(1).join(' ') || undefined };
  }

  const go = parseGo(parts, lower);
  return go ?? { type: 'unknown', raw: trimmed };
}

export function parseGameScript(script: string): GameCommand[] {
  return script
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map(parseGameCommand);
}

function parseChoiceCommand(kind: 'choose' | 'draft', parts: string[], trimmed: string): GameCommand {
  const choice = parts.slice(1).join(' ');
  if (!choice) return { type: 'unknown', raw: trimmed };
  return kind === 'choose' ? { type: 'choose', choiceIdOrIndex: choice } : { type: 'draft', choiceIdOrIndex: choice };
}

function parseEquipCommand(head: 'equip' | 'unequip', parts: string[], trimmed: string): GameCommand {
  const itemId = parts[1] as GameItemId | undefined;
  if (!itemId || !ITEM_IDS.has(itemId)) return { type: 'unknown', raw: trimmed };
  return head === 'equip' ? { type: 'equip', itemId } : { type: 'unequip', itemId };
}

function parseCheatCommand(parts: string[], trimmed: string): GameCommand {
  if (parts[1] !== 'give') return { type: 'unknown', raw: trimmed };
  const itemId = parts[2] as GameItemId | undefined;
  if (!itemId || !ITEM_IDS.has(itemId)) return { type: 'unknown', raw: trimmed };
  return { type: 'cheat', action: 'give', itemId };
}

function parseGo(parts: string[], lower: string): GameCommand | null {
  const head = parts[0] ?? '';

  if (GO_ALIASES.has(head)) {
    const dir = parseFacing(parts[1]);
    if (!dir) return null;
    const steps = parts[2] !== undefined ? Number(parts[2]) : 1;
    if (!Number.isFinite(steps) || steps <= 0) return { type: 'unknown', raw: lower };
    return { type: 'go', direction: dir, steps };
  }

  if (LEFT_ALIASES.has(head) || RIGHT_ALIASES.has(head)) {
    const dir: GameFacing = LEFT_ALIASES.has(head) ? 'left' : 'right';
    const steps = parts[1] !== undefined ? Number(parts[1]) : 1;
    if (!Number.isFinite(steps) || steps <= 0) return { type: 'unknown', raw: lower };
    return { type: 'go', direction: dir, steps };
  }

  return null;
}

function parseFacing(raw: string | undefined): GameFacing | null {
  if (!raw) return null;
  if (raw === 'left' || raw === 'l' || raw === 'west' || raw === 'w') return 'left';
  if (raw === 'right' || raw === 'r' || raw === 'east' || raw === 'e') return 'right';
  return null;
}
