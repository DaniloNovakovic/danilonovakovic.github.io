import { describe, expect, it } from 'vitest';
import {
  getPotassiumEnemyConfig,
  getPotassiumLaneCenterX,
  resolvePotassiumEnemySetupFacts,
  resolvePotassiumEnemySpawnFacts,
  resolvePotassiumEnemySpawnX,
  resolvePotassiumSplitterChildFacts
} from './potassiumSlipEnemyFactory';
import { POTASSIUM_COLUMN_COUNT } from './potassiumSlipWaves';

const layout = {
  arenaLeft: 275,
  arenaRight: 725,
  safeTop: 58
};

describe('potassium slip enemy factory', () => {
  it('keeps enemy config facts in one locality point', () => {
    expect(getPotassiumEnemyConfig('intern')).toMatchObject({
      label: 'Intern Bug',
      hp: 2,
      score: 1,
      texture: 'potassium_enemy_intern',
      scale: 0.92
    });
    expect(getPotassiumEnemyConfig('boss')).toMatchObject({
      label: 'Potassium Compliance Officer',
      hp: 92,
      score: 12,
      speed: 8
    });
  });

  it('resolves lane centers and splitter two-lane spawn positions', () => {
    expect(getPotassiumLaneCenterX(layout, 0)).toBeCloseTo(371.2);
    expect(getPotassiumLaneCenterX(layout, POTASSIUM_COLUMN_COUNT - 1)).toBeCloseTo(628.8);

    const splitterX = resolvePotassiumEnemySpawnX(layout, 'splitter', 2);
    expect(splitterX).toBe(
      (getPotassiumLaneCenterX(layout, 2) + getPotassiumLaneCenterX(layout, 3)) / 2
    );
  });

  it('resolves spawn facts without requiring Phaser sprite creation', () => {
    expect(resolvePotassiumEnemySpawnFacts({ layout, kind: 'intern', columnIndex: 1 })).toEqual({
      x: getPotassiumLaneCenterX(layout, 1),
      y: layout.safeTop + 12,
      texture: 'potassium_enemy_intern'
    });
    expect(resolvePotassiumEnemySpawnFacts({ layout, kind: 'boss' })).toEqual({
      x: getPotassiumLaneCenterX(layout, 0),
      y: layout.safeTop + 60,
      texture: 'potassium_enemy_boss'
    });
  });

  it('resolves setup facts for scaled hp, body profile, and attachments', () => {
    const wall = resolvePotassiumEnemySetupFacts({
      kind: 'wall',
      wave: 9,
      columnIndex: 3,
      rowIndex: 2
    });
    expect(wall).toMatchObject({
      depth: 60,
      scale: 0.78,
      hp: 23,
      bodyProfile: { width: 68, height: 52 },
      immovable: true,
      isBoss: false,
      attachment: {
        kind: 'wall',
        label: 'Wooden Wall',
        hp: 23
      }
    });
    expect(wall.data).toMatchObject({
      kind: 'wall',
      hp: 23,
      maxHp: 23,
      indestructible: false,
      splitsOnDeath: false,
      columnSpan: 1,
      occupiedColumns: [3]
    });
  });

  it('resolves splitter, shield, and boss special setup facts', () => {
    const splitter = resolvePotassiumEnemySetupFacts({
      kind: 'splitter',
      wave: 5,
      columnIndex: 2,
      rowIndex: 4
    });
    expect(splitter.data).toMatchObject({
      columnSpan: 2,
      occupiedColumns: [2, 3],
      splitsOnDeath: true
    });
    expect(splitter.bodyProfile).toEqual({ width: 118, height: 52 });

    const shield = resolvePotassiumEnemySetupFacts({
      kind: 'shield',
      wave: 8,
      columnIndex: 1,
      rowIndex: 2
    });
    expect(shield.attachment.shieldSide).toBeDefined();
    expect(shield.bodyProfile).toEqual({ width: 54, height: 54 });

    const boss = resolvePotassiumEnemySetupFacts({
      kind: 'boss',
      wave: 11,
      columnIndex: 0,
      rowIndex: 0
    });
    expect(boss).toMatchObject({
      depth: 80,
      hp: 92,
      isBoss: true,
      immovable: false
    });
    expect(boss.data).toMatchObject({ kind: 'boss', bossPhase: 1 });
  });

  it('resolves splitter child tuning without touching Phaser', () => {
    expect(resolvePotassiumSplitterChildFacts({ hp: 4 })).toEqual({
      scale: 0.62,
      hp: 3,
      speed: 72
    });
  });
});
