import type { GameCommand, GameFacing, GameItemId } from './types';

const ITEM_IDS = new Set<GameItemId>(['glasses', 'circuit']);

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

  if (head === 'help' || head === '?') return { type: 'help' };
  if (head === 'look' || head === 'l') {
    // `l` alone is look; `l 2` is go left 2 (Ridge habit). Prefer go when steps given.
    if (parts.length === 1) return { type: 'look' };
  }
  if (head === 'status') return { type: 'status' };
  if (head === 'inventory' || head === 'inv' || head === 'i') return { type: 'inventory' };
  if (head === 'close' || head === 'back') return { type: 'close' };
  if (head === 'leave') return { type: 'leave' };
  if (head === 'advance' || head === 'z' || head === 'continue') return { type: 'advance' };
  if (head === 'start') return { type: 'start' };
  if (head === 'fight' || head === 'clear') return { type: 'fight' };

  if (head === 'choose') {
    const choice = parts.slice(1).join(' ');
    return choice ? { type: 'choose', choiceIdOrIndex: choice } : { type: 'unknown', raw: trimmed };
  }

  if (head === 'draft') {
    const choice = parts.slice(1).join(' ');
    return choice ? { type: 'draft', choiceIdOrIndex: choice } : { type: 'unknown', raw: trimmed };
  }

  if (head === 'equip' || head === 'unequip') {
    const itemId = parts[1] as GameItemId | undefined;
    if (!itemId || !ITEM_IDS.has(itemId)) return { type: 'unknown', raw: trimmed };
    return head === 'equip' ? { type: 'equip', itemId } : { type: 'unequip', itemId };
  }

  if (head === 'cheat' && parts[1] === 'give') {
    const itemId = parts[2] as GameItemId | undefined;
    if (!itemId || !ITEM_IDS.has(itemId)) return { type: 'unknown', raw: trimmed };
    return { type: 'cheat', action: 'give', itemId };
  }

  if (head === 'interact' || head === 'use' || head === 'talk') {
    const target = parts.slice(1).join(' ') || undefined;
    return { type: 'interact', target };
  }

  const go = parseGo(parts, lower);
  if (go) return go;

  return { type: 'unknown', raw: trimmed };
}

export function parseGameScript(script: string): GameCommand[] {
  return script
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map(parseGameCommand);
}

function parseGo(parts: string[], lower: string): GameCommand | null {
  const head = parts[0] ?? '';

  if (head === 'go' || head === 'walk' || head === 'move') {
    const dir = parseFacing(parts[1]);
    if (!dir) return null;
    const steps = parts[2] !== undefined ? Number(parts[2]) : 1;
    if (!Number.isFinite(steps) || steps <= 0) return { type: 'unknown', raw: lower };
    return { type: 'go', direction: dir, steps };
  }

  // Shortcuts: left / right / l / r [steps]
  if (head === 'left' || head === 'l' || head === 'right' || head === 'r') {
    const dir: GameFacing = head === 'left' || head === 'l' ? 'left' : 'right';
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
