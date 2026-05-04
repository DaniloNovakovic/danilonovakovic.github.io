import { describe, expect, it, vi } from 'vitest';
import {
  PotassiumCommandAdapter,
  type PotassiumCommandAdapterPorts,
  type PotassiumCommandObject
} from './potassiumSlipCommandAdapter';
import { createPotassiumSession, type PotassiumSessionState } from './potassiumSlipSession';

function makeObject(overrides: Partial<PotassiumCommandObject> & { data?: Record<string, unknown> } = {}): PotassiumCommandObject {
  const data = new Map<string, unknown>(Object.entries(overrides.data ?? {}));
  const object: PotassiumCommandObject = {
    x: overrides.x ?? 300,
    y: overrides.y ?? 150,
    angle: overrides.angle ?? 0,
    active: overrides.active ?? true,
    body: overrides.body ?? {
      velocity: { x: 120, y: 0 },
      enable: true
    },
    getData: (key) => data.get(key),
    setData: (key, value) => {
      data.set(key, value);
      return object;
    },
    setTint: vi.fn(() => object),
    clearTint: vi.fn(() => object),
    setVelocity: vi.fn((x: number, y: number) => {
      object.body.velocity.x = x;
      object.body.velocity.y = y;
      return object;
    }),
    setVelocityX: vi.fn((x: number) => {
      object.body.velocity.x = x;
      return object;
    }),
    setVelocityY: vi.fn((y: number) => {
      object.body.velocity.y = y;
      return object;
    }),
    setAngularVelocity: vi.fn(() => object),
    setPosition: vi.fn((x: number, y: number) => {
      object.x = x;
      object.y = y;
      return object;
    }),
    setX: vi.fn((x: number) => {
      object.x = x;
      return object;
    }),
    setAngle: vi.fn((angle: number) => {
      object.angle = angle;
      return object;
    }),
    setScale: vi.fn(() => object),
    destroy: vi.fn(() => {
      object.active = false;
      return object;
    }),
    ...overrides
  };
  return object;
}

function makeAdapter(overrides: Partial<PotassiumCommandAdapterPorts> = {}) {
  let session: PotassiumSessionState = createPotassiumSession();
  const enemies: PotassiumCommandObject[] = [];
  const projectiles: PotassiumCommandObject[] = [];
  const calls: string[] = [];
  const main = makeObject({ data: { canDuplicate: true, effectMultiplier: 1, canApplyHitProcs: true } });
  projectiles.push(main);

  const basePorts: PotassiumCommandAdapterPorts = {
    runtime: {
      getNow: () => 1000,
      getSession: () => session,
      applySessionResult: (result) => {
        session = result.state;
        calls.push('applySessionResult');
      },
      getSkillRank: (upgrade) => session.skillRanks[upgrade] ?? 0,
      getGenericRank: (upgrade) => session.genericRanks[upgrade] ?? 0,
      setHint: (text) => calls.push(`hint:${text ?? ''}`),
      collectCircuit: () => calls.push('collectCircuit'),
      saveRunRecord: () => calls.push('saveRunRecord'),
      closeScene: () => calls.push('closeScene')
    },
    objects: {
      getEnemies: () => enemies,
      getProjectiles: () => projectiles,
      getMainProjectile: () => main,
      isMainProjectile: (projectile) => projectile === main,
      isMainProjectileRecalling: () => false,
      getProjectileExplosionRadiusMultiplier: (projectile) => projectile === main ? 1 : 0.5,
      getMaxMainProjectileSpeed: () => 760,
      getExplosionRadiusMultiplier: () => 1,
      getExplosionHits: () => enemies.map((enemy) => ({ enemy, distance: 0 })),
      getGhostBeamHits: () => enemies.map((enemy) => ({ enemy, inBeam: true }))
    },
    board: {
      resetBoardObjects: () => calls.push('resetBoardObjects'),
      spawnWave: (wave) => calls.push(`spawnWave:${wave}`),
      spawnBossDelayed: () => calls.push('spawnBossDelayed'),
      scheduleWaveRows: () => calls.push('scheduleWaveRows'),
      scheduleUpgradeChoices: () => calls.push('scheduleUpgradeChoices'),
      advanceWaveAfterDelay: (wave) => calls.push(`advanceWave:${wave}`),
      stopMainProjectile: () => calls.push('stopMainProjectile'),
      clearBoardForOutcome: () => calls.push('clearBoardForOutcome'),
      spawnFirePatch: () => calls.push('spawnFirePatch'),
      spawnBananaClones: () => calls.push('spawnBananaClones'),
      spawnSplitterChildren: () => calls.push('spawnSplitterChildren'),
      spawnBossOrbitBlockers: () => calls.push('spawnBossOrbitBlockers'),
      updateBossOrbitBlockers: () => calls.push('updateBossOrbitBlockers'),
      setBossStoneVisual: () => calls.push('setBossStoneVisual'),
      spawnBossSummons: () => calls.push('spawnBossSummons'),
      clearOrbitBlockers: () => calls.push('clearOrbitBlockers')
    },
    renderer: {
      hideMainOverlay: () => calls.push('hideMainOverlay'),
      clearTerminalOverlay: () => calls.push('clearTerminalOverlay'),
      clearUpgradeChoiceOverlay: () => calls.push('clearUpgradeChoiceOverlay'),
      showUpgradeChoices: () => calls.push('showUpgradeChoices'),
      refreshAllProjectileVisuals: () => calls.push('refreshAllProjectileVisuals'),
      updateHud: () => calls.push('updateHud'),
      showOutcomeOverlay: () => calls.push('showOutcomeOverlay'),
      showTerminal: () => calls.push('showTerminal'),
      showDamageCue: () => calls.push('showDamageCue'),
      showExplosionVisual: () => calls.push('showExplosionVisual'),
      shakeCamera: () => calls.push('shakeCamera'),
      showGhostBeam: () => calls.push('showGhostBeam'),
      showGhostStatusField: () => calls.push('showGhostStatusField'),
      animateEnemyDeath: (_enemy, onComplete) => {
        calls.push('animateEnemyDeath');
        onComplete();
      }
    }
  };
  const ports: PotassiumCommandAdapterPorts = {
    runtime: { ...basePorts.runtime, ...overrides.runtime },
    objects: { ...basePorts.objects, ...overrides.objects },
    board: { ...basePorts.board, ...overrides.board },
    renderer: { ...basePorts.renderer, ...overrides.renderer }
  };

  const adapter = new PotassiumCommandAdapter(ports, {
    arena: { left: 275, right: 725, top: 0, bottom: 600 },
    poisonTint: 0x65a30d,
    cloneRicochetMaxSpeed: 660,
    bananaRicochetMinSpeed: 360,
    bananaRicochetBoost: 1.08,
    poisonDeathSpreadRadius: 76,
    ghostStatusFieldLifetimeMs: 680,
    ghostBeamLifetimeMs: 190
  });
  return { adapter, calls, enemies, projectiles, main, getSession: () => session };
}

describe('potassium command adapter', () => {
  it('routes representative session commands through injected ports', () => {
    const { adapter, calls } = makeAdapter();

    adapter.applySessionCommands([
      { type: 'hideMainOverlay' },
      { type: 'setHint', text: 'Go' },
      { type: 'spawnWave', wave: 2 },
      { type: 'collectCircuit' },
      { type: 'closeScene' }
    ]);

    expect(calls).toEqual([
      'hideMainOverlay',
      'hint:Go',
      'spawnWave:2',
      'collectCircuit',
      'closeScene'
    ]);
  });

  it('extracts facts and applies combat damage commands recursively', () => {
    const enemy = makeObject({
      data: {
        kind: 'intern',
        hp: 1,
        maxHp: 3,
        indestructible: false,
        splitsOnDeath: false
      }
    });
    const { adapter, calls, enemies } = makeAdapter();
    enemies.push(enemy);

    const facts = adapter.getEnemyCombatFacts(enemy);
    expect(facts).toMatchObject({ id: 'enemy-0', kind: 'intern', hp: 1, maxHp: 3 });

    adapter.applyCombatCommands([
      { type: 'damageEnemy', enemyId: facts.id, amount: 1, source: 'banana' }
    ], adapter.createCombatContext([enemy]));

    expect(enemy.getData('dying')).toBe(true);
    expect(enemy.active).toBe(false);
    expect(calls).toContain('animateEnemyDeath');
    expect(calls).toContain('applySessionResult');
  });

  it('applies poison and boss commands through the adapter seam', () => {
    const boss = makeObject({
      data: {
        kind: 'boss',
        hp: 92,
        maxHp: 92
      }
    });
    const { adapter, calls } = makeAdapter();

    adapter.applyCombatCommands([
      {
        type: 'applyPoison',
        enemyId: 'boss-id',
        effectMultiplier: 1,
        poisonMultiplier: 1.25,
        expiresAt: 3500,
        nextTickAt: 1500
      }
    ], { enemies: new Map([['boss-id', boss]]), projectiles: new Map() });
    expect(boss.getData('poisoned')).toBe(true);
    expect(boss.getData('poisonMultiplier')).toBe(1.25);

    adapter.applyBossCommands([
      { type: 'setBossPhase', phase: 2 },
      { type: 'setBossVelocity', velocityY: 16, velocityX: 54 },
      { type: 'setBossHint', text: 'Boss phase' },
      { type: 'spawnOrbitBlockers' },
      { type: 'updateOrbitBlockers', now: 1200 },
      { type: 'setStoneVisual', active: true },
      { type: 'spawnSummons', nextSummonAt: 2000, summons: [] },
      { type: 'clearOrbitBlockers' }
    ], boss);

    expect(boss.getData('bossPhase')).toBe(2);
    expect(boss.body.velocity).toMatchObject({ x: 54, y: 16 });
    expect(calls).toEqual(expect.arrayContaining([
      'hint:Boss phase',
      'spawnBossOrbitBlockers',
      'updateBossOrbitBlockers',
      'setBossStoneVisual',
      'spawnBossSummons',
      'clearOrbitBlockers'
    ]));
  });
});
