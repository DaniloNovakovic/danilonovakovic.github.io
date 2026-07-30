// Command parsers are table-driven; remaining branching is intentional CLI surface area.
// fallow-ignore-file complexity
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
