// Command parsers are table-driven; remaining branching is intentional CLI surface area.
// fallow-ignore-file complexity
import type { GameCommand, GameFacing, GameItemId } from './types';

const ITEM_IDS = new Set<GameItemId>(['glasses', 'circuit']);

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
  fight: { type: 'fight' },
  clear: { type: 'fight' }
};

const GO_ALIASES = new Set(['go', 'walk', 'move']);
const LEFT_ALIASES = new Set(['left', 'l']);
const RIGHT_ALIASES = new Set(['right', 'r']);
const INTERACT_ALIASES = new Set(['interact', 'use', 'talk']);

export function getGameHelpText(): string {
  return [
    'Game Console — full headless play (Overworld → Basement → Potassium → Ridge)',
    '',
    'Shared:',
    '  help | look | status | inventory',
    '  go left|right [n]   (also: left/right/l/r [n])',
    '  interact [name]     nearest prompt wins if name omitted',
    '  equip <item> | unequip <item>   items: glasses, circuit',
    '  close | leave | back            close overlay / leave room / leave talk',
    '',
    'Ridge conversation:',
    '  advance | choose <id|index>',
    '',
    'Potassium (discrete campaign):',
    '  start | fight | draft <id|index>',
    '',
    'AI cheats:',
    '  cheat give glasses|circuit',
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

  const simple = SIMPLE_COMMANDS[head];
  if (simple) return simple;

  if (head === 'choose') return parseChoiceCommand('choose', parts, trimmed);
  if (head === 'draft') return parseChoiceCommand('draft', parts, trimmed);
  if (head === 'equip' || head === 'unequip') return parseEquipCommand(head, parts, trimmed);
  if (head === 'cheat') return parseCheatCommand(parts, trimmed);
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

function parseChoiceCommand(
  kind: 'choose' | 'draft',
  parts: string[],
  trimmed: string
): GameCommand {
  const choice = parts.slice(1).join(' ');
  if (!choice) return { type: 'unknown', raw: trimmed };
  return kind === 'choose'
    ? { type: 'choose', choiceIdOrIndex: choice }
    : { type: 'draft', choiceIdOrIndex: choice };
}

function parseEquipCommand(
  head: 'equip' | 'unequip',
  parts: string[],
  trimmed: string
): GameCommand {
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
