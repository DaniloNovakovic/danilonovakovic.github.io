import type { RidgeCommand, RidgeFacing } from './types';

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
  'Script mode: separate commands with `;`',
  'Example: look; go right 3; interact; advance; advance'
].join('\n');

export function getRidgeHelpText(): string {
  return HELP_TEXT;
}

export function parseRidgeCommand(rawInput: string): RidgeCommand {
  const raw = rawInput.trim().replace(/\s+/g, ' ');
  if (!raw) return { type: 'unknown', raw: '' };

  const [head, ...rest] = raw.toLowerCase().split(' ');
  const args = rest;

  switch (head) {
    case 'help':
    case '?':
    case 'h':
      return { type: 'help' };
    case 'look':
    case 'l':
      return { type: 'look' };
    case 'status':
    case 'stat':
      return { type: 'status' };
    case 'inventory':
    case 'inv':
    case 'i':
      return { type: 'inventory' };
    case 'go':
    case 'walk':
    case 'move': {
      const direction = parseDirection(args[0]);
      if (!direction) return { type: 'unknown', raw };
      const steps = args[1] ? Number.parseFloat(args[1]) : 1;
      if (!Number.isFinite(steps) || steps <= 0) return { type: 'unknown', raw };
      return { type: 'go', direction, steps };
    }
    case 'left':
    case 'west':
    case 'a':
      return { type: 'go', direction: 'left', steps: parseOptionalSteps(args[0]) };
    case 'right':
    case 'east':
    case 'd':
      return { type: 'go', direction: 'right', steps: parseOptionalSteps(args[0]) };
    case 'interact':
    case 'talk':
    case 'use':
    case 'e':
    case 'x':
      return { type: 'interact', target: args.join(' ') || undefined };
    case 'advance':
    case 'next':
    case 'continue':
    case 'n':
    case 'z':
      return { type: 'advance' };
    case 'choose':
    case 'pick':
    case 'select':
      if (!args[0]) return { type: 'unknown', raw };
      return { type: 'choose', choiceIdOrIndex: args[0] };
    case 'leave':
    case 'back':
    case 'close':
      return { type: 'leave' };
    default:
      return { type: 'unknown', raw };
  }
}

export function parseRidgeScript(script: string): RidgeCommand[] {
  return script
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map(parseRidgeCommand);
}

function parseDirection(value: string | undefined): RidgeFacing | null {
  if (!value) return null;
  if (value === 'left' || value === 'west' || value === 'a' || value === 'l') {
    return 'left';
  }
  if (value === 'right' || value === 'east' || value === 'd' || value === 'r') {
    return 'right';
  }
  return null;
}

function parseOptionalSteps(value: string | undefined): number {
  if (!value) return 1;
  const steps = Number.parseFloat(value);
  return Number.isFinite(steps) && steps > 0 ? steps : 1;
}
