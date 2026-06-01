import { describe, expect, it } from 'vitest';
import { createBridgeTracerInteractionTargets } from './bridgeTracerSlice';
import { createBridgeStageDebugDrawCommands } from './bridgeStageDebugOverlay';

const debugOff = {
  graybox: false,
  showColliders: false,
  showPlayerBody: false,
  showInteractZones: false,
  showTraversalAssists: false
};

describe('Bridge Stage debug overlay draw commands', () => {
  it('returns no commands when Bridge debug settings are disabled', () => {
    expect(createBridgeStageDebugDrawCommands({
      interactionTargets: [],
      settings: debugOff
    })).toEqual([]);
  });

  it('draws the Walk Rail, Stage Spots, interactions, and player body', () => {
    const commands = createBridgeStageDebugDrawCommands({
      interactionTargets: createBridgeTracerInteractionTargets({
        activeAreaId: 'bridge',
        bridgeBeat: 'intro'
      }),
      player: {
        x: 520,
        y: 500,
        body: {
          x: 500,
          y: 435,
          width: 40,
          height: 65
        }
      },
      railProgress: 0.18,
      settings: {
        graybox: false,
        showColliders: false,
        showPlayerBody: true,
        showInteractZones: true,
        showTraversalAssists: true
      }
    });

    expect(commands.some((command) => command.id.startsWith('walk-rail:primary'))).toBe(true);
    expect(commands.some((command) => command.id === 'stage-spot:cicka-play')).toBe(true);
    expect(commands.some((command) => command.id === 'interact:cicka')).toBe(true);
    expect(commands.some((command) => command.id === 'player-body')).toBe(true);
    expect(commands.some((command) => command.id === 'walk-rail:player-progress')).toBe(true);
  });

  it('treats graybox mode as a composite Bridge Stage overlay', () => {
    const commands = createBridgeStageDebugDrawCommands({
      interactionTargets: [],
      settings: {
        ...debugOff,
        graybox: true
      }
    });

    expect(commands.some((command) => command.id === 'stage-canvas')).toBe(true);
    expect(commands.some((command) => command.id.startsWith('stage-occluder:'))).toBe(true);
    expect(commands.some((command) => command.id.startsWith('walk-rail:primary'))).toBe(true);
    expect(commands.some((command) => command.id.startsWith('stage-spot:'))).toBe(true);
  });
});
