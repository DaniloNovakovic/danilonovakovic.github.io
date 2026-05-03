import { describe, expect, it } from 'vitest';
import {
  createPotassiumSession,
  markPotassiumRowSpawned,
  resolvePotassiumDraftChoice,
  resolvePotassiumEnemyEscaped,
  resolvePotassiumEnemyKilled,
  resolvePotassiumOutcome,
  resolvePotassiumTerminalAction,
  resolvePotassiumWaveClear,
  showPotassiumDraftChoices,
  spawnPotassiumWave,
  startPotassiumCampaign,
  startPotassiumEndless,
  type PotassiumSessionCommand,
  type PotassiumSessionState
} from './potassiumSlipSession';
import {
  POTASSIUM_BOSS_WAVE,
  POTASSIUM_ENDLESS_START_WAVE,
  POTASSIUM_UPGRADES
} from './potassiumSlipWaves';

describe('potassium slip session', () => {
  it('starts a fresh campaign with board reset, hint, wave spawn, and HUD commands', () => {
    const previous = {
      ...createPotassiumSession(),
      score: 99,
      lives: 1,
      gameState: 'GAME_OVER' as const
    };

    const result = startPotassiumCampaign(previous);

    expect(result.state).toMatchObject({
      gameState: 'PLAYING',
      score: 0,
      lives: 5,
      wave: 1,
      runMode: 'campaign',
      skillRanks: {},
      genericRanks: {}
    });
    expect(commandTypes(result.commands)).toEqual([
      'hideMainOverlay',
      'clearTerminal',
      'resetBoard',
      'setHint',
      'spawnWave',
      'updateHud'
    ]);
    expect(result.commands).toContainEqual({ type: 'setHint', text: 'Drag toward a target • Hold to recall' });
    expect(result.commands).toContainEqual({ type: 'spawnWave', wave: 1 });
  });

  it('only starts endless after a won campaign and spawns the endless start wave', () => {
    const blocked = startPotassiumEndless(createPotassiumSession());
    expect(blocked.commands).toEqual([]);

    const won = resolvePotassiumOutcome({
      ...createPotassiumSession(),
      gameState: 'PLAYING',
      score: 25,
      wave: POTASSIUM_BOSS_WAVE
    }, 'won', '2026-05-03T00:00:00.000Z').state;

    const result = startPotassiumEndless(won);

    expect(result.state).toMatchObject({
      gameState: 'PLAYING',
      runMode: 'endless',
      wave: POTASSIUM_BOSS_WAVE
    });
    expect(result.commands).toContainEqual({ type: 'spawnWave', wave: POTASSIUM_ENDLESS_START_WAVE });
    expect(result.commands).toContainEqual({ type: 'setHint', text: 'Endless audit • The nonsense keeps filing' });
  });

  it('spawns boss waves without scheduling rows', () => {
    const result = spawnPotassiumWave({
      ...createPotassiumSession(),
      gameState: 'PLAYING'
    }, POTASSIUM_BOSS_WAVE);

    expect(result.state).toMatchObject({
      wave: POTASSIUM_BOSS_WAVE,
      pendingRows: 0,
      waveAdvancing: false
    });
    expect(commandTypes(result.commands)).toEqual(['spawnBoss', 'setHint', 'updateHud']);
    expect(result.commands).toContainEqual({ type: 'setHint', text: 'Boss wave • Stop the audit before it lands' });
  });

  it('waits for pending rows and living enemies before scheduling upgrades', () => {
    const playing = spawnPotassiumWave({
      ...createPotassiumSession(),
      gameState: 'PLAYING'
    }, 1).state;
    const rowSpawned = markPotassiumRowSpawned(playing).state;

    expect(resolvePotassiumWaveClear({ state: rowSpawned, hasLivingEnemies: false }).commands).toEqual([]);
    const noPendingRows = { ...rowSpawned, pendingRows: 0 };
    expect(resolvePotassiumWaveClear({ state: noPendingRows, hasLivingEnemies: true }).commands).toEqual([]);

    const clear = resolvePotassiumWaveClear({ state: noPendingRows, hasLivingEnemies: false });
    expect(clear.state.waveAdvancing).toBe(true);
    expect(commandTypes(clear.commands)).toEqual(['setHint', 'scheduleUpgradeChoices']);
  });

  it('falls back to generic drafts when all skill choices are maxed', () => {
    const maxedSkills = Object.fromEntries(POTASSIUM_UPGRADES.map((upgrade) => [upgrade, 2]));
    const state: PotassiumSessionState = {
      ...createPotassiumSession(),
      gameState: 'PLAYING',
      wave: 3,
      skillRanks: maxedSkills,
      genericRanks: {
        damage: 1,
        poison: 1,
        explosion: 1,
        cloneTime: 1,
        bananaSpeed: 1,
        bonusLife: 1
      }
    };

    const result = showPotassiumDraftChoices(state);

    expect(result.state.gameState).toBe('UPGRADE');
    expect(result.commands.some((command) => command.type === 'showUpgradeChoices')).toBe(true);
  });

  it('updates skill drafts and emits projectile visual refresh, HUD, hint, and wave advance commands', () => {
    const result = resolvePotassiumDraftChoice({
      ...createPotassiumSession(),
      gameState: 'UPGRADE',
      wave: 2
    }, { kind: 'fire', action: 'unlock' });

    expect(result.state).toMatchObject({
      gameState: 'PLAYING',
      skillRanks: { fire: 1 }
    });
    expect(commandTypes(result.commands)).toEqual([
      'setHint',
      'refreshProjectileVisuals',
      'clearUpgradeChoices',
      'advanceWaveAfterDelay',
      'updateHud'
    ]);
    expect(result.commands).toContainEqual({ type: 'advanceWaveAfterDelay', wave: 3 });
  });

  it('keeps wave advancement guarded after a draft choice until the next wave spawns', () => {
    const draft = resolvePotassiumDraftChoice({
      ...createPotassiumSession(),
      gameState: 'UPGRADE',
      wave: 1
    }, { kind: 'fire', action: 'unlock' });

    expect(draft.state.waveAdvancing).toBe(true);

    const clear = resolvePotassiumWaveClear({
      state: draft.state,
      hasLivingEnemies: false
    });

    expect(clear.commands).toEqual([]);
  });

  it('updates generic bonus life drafts and emits HUD and hint commands', () => {
    const result = resolvePotassiumDraftChoice({
      ...createPotassiumSession(),
      gameState: 'UPGRADE',
      wave: 4,
      lives: 2
    }, { type: 'generic', kind: 'bonusLife' });

    expect(result.state.lives).toBe(3);
    expect(result.state.genericRanks).toEqual({ bonusLife: 1 });
    expect(result.commands).toContainEqual({ type: 'setHint', text: 'Bonus Life stacked • Endless paperwork trembles' });
    expect(result.commands).toContainEqual({ type: 'advanceWaveAfterDelay', wave: 5 });
    expect(result.commands.at(-1)?.type).toBe('updateHud');
  });

  it('adds enemy score and resolves boss kills as wins', () => {
    const intern = resolvePotassiumEnemyKilled({
      ...createPotassiumSession(),
      gameState: 'PLAYING',
      score: 2
    }, 3, 'intern');
    expect(intern.state.score).toBe(5);
    expect(intern.commands).toEqual([
      {
        type: 'updateHud',
        hud: expect.objectContaining({ score: 5, lives: 5 })
      }
    ]);

    const boss = resolvePotassiumEnemyKilled({
      ...intern.state,
      wave: POTASSIUM_BOSS_WAVE,
      runRecordCompletedAt: '2026-05-03T00:00:00.000Z'
    }, 12, 'boss');
    expect(boss.state.gameState).toBe('WON');
    expect(commandTypes(boss.commands)).toContain('collectCircuit');
    expect(boss.commands).toContainEqual({ type: 'showTerminal', outcome: 'won' });
  });

  it('decrements lives for normal escapes and resolves boss escapes as game over', () => {
    const escaped = resolvePotassiumEnemyEscaped({
      ...createPotassiumSession(),
      gameState: 'PLAYING',
      lives: 2
    }, 'intern');
    expect(escaped.state.lives).toBe(1);
    expect(escaped.state.gameState).toBe('PLAYING');

    const lethal = resolvePotassiumEnemyEscaped(escaped.state, 'deadline');
    expect(lethal.state.gameState).toBe('GAME_OVER');
    expect(lethal.commands).toContainEqual({ type: 'showTerminal', outcome: 'game_over' });

    const boss = resolvePotassiumEnemyEscaped({
      ...createPotassiumSession(),
      gameState: 'PLAYING',
      lives: 5
    }, 'boss');
    expect(boss.state.lives).toBe(0);
    expect(boss.state.gameState).toBe('GAME_OVER');
  });

  it('saves campaign wins and continued endless game overs with the same completedAt', () => {
    const completedAt = '2026-05-03T00:00:00.000Z';
    const campaign = resolvePotassiumOutcome({
      ...createPotassiumSession(),
      gameState: 'PLAYING',
      score: 25,
      wave: POTASSIUM_BOSS_WAVE
    }, 'won', completedAt);

    expect(campaign.commands).toContainEqual({ type: 'collectCircuit' });
    expect(campaign.commands).toContainEqual({
      type: 'saveRunRecord',
      record: {
        score: 25,
        wave: POTASSIUM_BOSS_WAVE,
        mode: 'campaign',
        outcome: 'won',
        completedAt
      }
    });

    const endless = resolvePotassiumOutcome({
      ...campaign.state,
      gameState: 'PLAYING',
      runMode: 'endless',
      score: 80,
      wave: 14
    }, 'game_over');

    expect(endless.commands).not.toContainEqual({ type: 'collectCircuit' });
    expect(endless.commands).toContainEqual({
      type: 'saveRunRecord',
      record: {
        score: 80,
        wave: 14,
        mode: 'endless',
        outcome: 'game_over',
        completedAt
      }
    });
  });

  it('resolves terminal actions to retry, endless, or close commands', () => {
    const won = {
      ...createPotassiumSession(),
      gameState: 'WON' as const
    };
    expect(resolvePotassiumTerminalAction(won, 'return').commands).toEqual([{ type: 'closeScene' }]);
    expect(resolvePotassiumTerminalAction(won, 'retry').commands).toContainEqual({ type: 'spawnWave', wave: 1 });
    expect(resolvePotassiumTerminalAction(won, 'endless').commands).toContainEqual({
      type: 'spawnWave',
      wave: POTASSIUM_ENDLESS_START_WAVE
    });
  });
});

function commandTypes(commands: readonly PotassiumSessionCommand[]): string[] {
  return commands.map((command) => command.type);
}
