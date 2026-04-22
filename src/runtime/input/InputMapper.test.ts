/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser BEFORE importing InputMapper to avoid Phaser's internal initialization that requires canvas
vi.mock('phaser', () => ({
  default: {
    Input: {
      Keyboard: {
        JustDown: vi.fn((key: any) => key.isJustDown || false)
      }
    }
  },
  Input: {
    Keyboard: {
      JustDown: vi.fn((key: any) => key.isJustDown || false)
    }
  }
}));

import { InputMapper } from './InputMapper';
import { bridgeStore, bridgeActions } from '../../shared/bridge/store';
import { MoveCommand, JumpCommand, InteractCommand } from '../../core/player/input/Command';

vi.mock('../../shared/bridge/store', () => ({
  bridgeStore: {
    getState: vi.fn()
  },
  bridgeActions: {
    consumeTouchOneShots: vi.fn()
  }
}));

function createFakeKey(isDown: boolean = false) {
  return { isDown };
}

describe('InputMapper', () => {
  let cursors: any;
  let wasd: any;
  let interactKey: any;
  let mapper: InputMapper;

  beforeEach(() => {
    vi.clearAllMocks();

    cursors = {
      up: createFakeKey(),
      down: createFakeKey(),
      left: createFakeKey(),
      right: createFakeKey(),
      space: createFakeKey(),
      shift: createFakeKey()
    };
    wasd = {
      a: createFakeKey(),
      d: createFakeKey()
    };
    interactKey = createFakeKey();

    // Default mock behavior
    vi.mocked(bridgeStore.getState).mockReturnValue({
      touch: { left: 0, right: 0 }
    } as any);
    vi.mocked(bridgeActions.consumeTouchOneShots).mockReturnValue({
      jumpQueued: false,
      interactTap: false
    });

    mapper = new InputMapper({ cursors, wasd, interactKey });
  });

  it('prefers keyboard direction over touch', () => {
    // Touch says right (1.0)
    vi.mocked(bridgeStore.getState).mockReturnValue({
      touch: { left: 0, right: 1 }
    } as any);
    
    // Keyboard says left
    cursors.left.isDown = true;

    const commands = mapper.getCommands(true, true);
    
    // Should contain a MoveCommand with axis -1 (left)
    const move = commands.find(c => c instanceof MoveCommand) as any;
    expect(move).toBeDefined();
    
    const state = { analogX: 0 } as any;
    move.execute(state);
    expect(state.analogX).toBe(-1);
  });

  it('allows touch to sprint without shift if allowSprint is true', () => {
    vi.mocked(bridgeStore.getState).mockReturnValue({
      touch: { left: 0, right: 0.5 }
    } as any);

    const commands = mapper.getCommands(true, true);
    const move = commands.find(c => c instanceof MoveCommand) as any;
    const state = { sprint: false } as any;
    move.execute(state);
    expect(state.sprint).toBe(true);
  });

  it('requires shift for keyboard sprint', () => {
    cursors.right.isDown = true;
    cursors.shift.isDown = false;

    const commands = mapper.getCommands(true, true);
    const move = commands.find(c => c instanceof MoveCommand) as any;
    const state = { sprint: false } as any;
    move.execute(state);
    expect(state.sprint).toBe(false);

    cursors.shift.isDown = true;
    const commands2 = mapper.getCommands(true, true);
    const move2 = commands2.find(c => c instanceof MoveCommand) as any;
    move2.execute(state);
    expect(state.sprint).toBe(true);
  });

  it('gathers jump from keyboard or touch one-shot', () => {
    vi.mocked(bridgeActions.consumeTouchOneShots).mockReturnValue({
      jumpQueued: true,
      interactTap: false
    });

    const commands = mapper.getCommands(true, true);
    expect(commands.some(c => c instanceof JumpCommand)).toBe(true);
    
    // Check allowJump gating
    const commandsGated = mapper.getCommands(false, true);
    expect(commandsGated.some(c => c instanceof JumpCommand)).toBe(false);
  });

  it('gathers interact from touch one-shot', () => {
    vi.mocked(bridgeActions.consumeTouchOneShots).mockReturnValue({
      jumpQueued: false,
      interactTap: true
    });

    const commands = mapper.getCommands(true, true);
    expect(commands.some(c => c instanceof InteractCommand)).toBe(true);
  });

  it('returns the same array instance (ephemeral)', () => {
    const commands1 = mapper.getCommands(true, true);
    const commands2 = mapper.getCommands(true, true);
    expect(commands1).toBe(commands2);
  });
});
