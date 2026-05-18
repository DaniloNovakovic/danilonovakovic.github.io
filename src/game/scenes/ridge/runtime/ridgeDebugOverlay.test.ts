import { describe, expect, it } from 'vitest';
import {
  RIDGE_BLOCKOUT,
  compileRidgeBlockoutFacts,
  deriveRidgeBlockoutGeometry
} from '../blockout';
import type { CickaInteractionCopy } from '../cicka/interaction';
import { createRidgeInteractionTargets } from './ridgeInteractionTargets';
import { createRidgeDebugDrawCommands } from './ridgeDebugOverlay';

const cickaCopy: CickaInteractionCopy = {
  fresh: 'fresh',
  stampedeMemory: 'memory'
};

const debugOff = {
  graybox: false,
  showColliders: false,
  showPlayerBody: false,
  showInteractZones: false,
  showTraversalAssists: false
};

describe('ridge debug overlay draw commands', () => {
  it('returns no commands when all debug settings are disabled', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);

    expect(createRidgeDebugDrawCommands({
      geometry,
      interactionTargets: [],
      settings: debugOff
    })).toEqual([]);
  });

  it('creates source-backed collider, player, interaction, and traversal commands', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);
    const facts = compileRidgeBlockoutFacts(RIDGE_BLOCKOUT, { geometry });
    const interactionTargets = createRidgeInteractionTargets({
      facts,
      cickaInteractionCopy: cickaCopy,
      getWorldMemories: () => []
    });

    const commands = createRidgeDebugDrawCommands({
      geometry,
      interactionTargets,
      player: {
        x: 300,
        y: 400,
        body: {
          x: 280,
          y: 350,
          width: 40,
          height: 90
        }
      },
      settings: {
        graybox: false,
        showColliders: true,
        showPlayerBody: true,
        showInteractZones: true,
        showTraversalAssists: true
      }
    });

    expect(commands.some((command) => command.id.startsWith('collider:'))).toBe(true);
    expect(commands.some((command) => command.id === 'player-body')).toBe(true);
    expect(commands.some((command) => command.id.startsWith('interact:'))).toBe(true);
    expect(commands.some((command) => command.id.startsWith('assist-line:'))).toBe(true);
  });

  it('treats graybox mode as a composite geometry overlay', () => {
    const geometry = deriveRidgeBlockoutGeometry(RIDGE_BLOCKOUT);

    const commands = createRidgeDebugDrawCommands({
      geometry,
      interactionTargets: [],
      player: {
        x: 300,
        y: 400,
        body: {
          x: 280,
          y: 350,
          width: 40,
          height: 90
        }
      },
      settings: {
        ...debugOff,
        graybox: true
      }
    });

    expect(commands.some((command) => command.id === 'graybox-wash')).toBe(true);
    expect(commands.some((command) => command.id.startsWith('room:'))).toBe(true);
    expect(commands.some((command) => command.id.startsWith('anchor:'))).toBe(true);
    expect(commands.some((command) => command.id.startsWith('collider:'))).toBe(true);
    expect(commands.some((command) => command.id === 'player-body')).toBe(true);
  });
});
