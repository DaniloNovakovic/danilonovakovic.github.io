import type { PotassiumRunRecord, PotassiumRunOutcome } from './leaderboard';
import type { PotassiumBossSummonFacts } from './boss';
import type { PotassiumDraftChoiceView, PotassiumHudFacts } from './session';
import type { PotassiumSessionState, PotassiumSessionResult } from './session';
import type { PotassiumDamageSource, PotassiumGhostBeamDirection } from './combat';
import type {
  PotassiumGenericUpgradeKind,
  PotassiumScheduledWaveRow,
  PotassiumUpgradeKind
} from './waves';

export interface PotassiumCommandBody {
  velocity: { x: number; y: number };
  enable?: boolean;
  setAllowGravity?: (allow: boolean) => unknown;
  setImmovable?: (immovable: boolean) => unknown;
  setSize?: (width: number, height: number, center?: boolean) => unknown;
}

export interface PotassiumCommandObject {
  x: number;
  y: number;
  angle: number;
  active: boolean;
  body: PotassiumCommandBody;
  getData(key: string): unknown;
  setData(key: string, value: unknown): unknown;
  setTint(color: number): unknown;
  clearTint(): unknown;
  setVelocity(x: number, y: number): unknown;
  setVelocityX(x: number): unknown;
  setVelocityY(y: number): unknown;
  setAngularVelocity?(velocity: number): unknown;
  setPosition(x: number, y: number): unknown;
  setX(x: number): unknown;
  setAngle(angle: number): unknown;
  setScale(scale: number): unknown;
  destroy(): unknown;
}

export interface PotassiumCombatContext {
  enemies: Map<string, PotassiumCommandObject>;
  projectiles: Map<string, PotassiumCommandObject>;
}

export interface PotassiumCommandAdapterRuntimePorts {
  getNow(): number;
  getSession(): PotassiumSessionState;
  applySessionResult(result: PotassiumSessionResult): void;
  getSkillRank(upgrade: PotassiumUpgradeKind): number;
  getGenericRank(upgrade: PotassiumGenericUpgradeKind): number;
  setHint(text: string | null): void;
  collectCircuit(): void;
  saveRunRecord(record: PotassiumRunRecord): void;
  closeScene(): void;
}

export interface PotassiumCommandAdapterObjectPorts {
  getEnemies(): PotassiumCommandObject[];
  getProjectiles(): PotassiumCommandObject[];
  getMainProjectile(): PotassiumCommandObject;
  isMainProjectile(projectile: PotassiumCommandObject): boolean;
  isMainProjectileRecalling(): boolean;
  getProjectileExplosionRadiusMultiplier(projectile: PotassiumCommandObject): number;
  getMaxMainProjectileSpeed(): number;
  getExplosionRadiusMultiplier(): number;
  getExplosionHits(x: number, y: number): Array<{ enemy: PotassiumCommandObject; distance: number }>;
  getGhostBeamHits(
    x: number,
    y: number,
    direction: PotassiumGhostBeamDirection
  ): Array<{ enemy: PotassiumCommandObject; inBeam: boolean }>;
}

export interface PotassiumCommandAdapterBoardPorts {
  resetBoardObjects(): void;
  spawnWave(wave: number): void;
  spawnBossDelayed(): void;
  scheduleWaveRows(schedule: readonly PotassiumScheduledWaveRow[]): void;
  scheduleUpgradeChoices(): void;
  advanceWaveAfterDelay(wave: number): void;
  stopMainProjectile(): void;
  clearBoardForOutcome(): void;
  spawnFirePatch(x: number, y: number, effectMultiplier: number, lifetimeMs: number, scale: number): void;
  spawnBananaClones(count: number, lifetimeMs: number): void;
  spawnSplitterChildren(enemy: PotassiumCommandObject): void;
  spawnBossOrbitBlockers(boss: PotassiumCommandObject): void;
  updateBossOrbitBlockers(boss: PotassiumCommandObject, time: number): void;
  setBossStoneVisual(boss: PotassiumCommandObject, active: boolean): void;
  spawnBossSummons(summons: readonly PotassiumBossSummonFacts[]): void;
  clearOrbitBlockers(): void;
}

export interface PotassiumCommandAdapterRendererPorts {
  hideMainOverlay(): void;
  clearTerminalOverlay(): void;
  clearUpgradeChoiceOverlay(): void;
  showUpgradeChoices(choices: readonly PotassiumDraftChoiceView[]): void;
  refreshAllProjectileVisuals(): void;
  updateHud(hud: PotassiumHudFacts): void;
  showOutcomeOverlay(input: { title: string; score: number; titleFontSize: number }): void;
  showTerminal(outcome: PotassiumRunOutcome): void;
  showDamageCue(enemy: PotassiumCommandObject, source: PotassiumDamageSource): void;
  showExplosionVisual(x: number, y: number, radius: number): void;
  shakeCamera(durationMs: number, intensity: number): void;
  showGhostBeam(input: {
    x: number;
    y: number;
    direction: PotassiumGhostBeamDirection;
    durationMs: number;
  }): void;
  showGhostStatusField(input: {
    x: number;
    y: number;
    direction: PotassiumGhostBeamDirection;
    poisonActive: boolean;
    durationMs: number;
  }): void;
  animateEnemyDeath(enemy: PotassiumCommandObject, onComplete: () => void): void;
}

export interface PotassiumCommandAdapterPorts {
  runtime: PotassiumCommandAdapterRuntimePorts;
  objects: PotassiumCommandAdapterObjectPorts;
  board: PotassiumCommandAdapterBoardPorts;
  renderer: PotassiumCommandAdapterRendererPorts;
}

export type PotassiumCommandAdapterFlatPorts =
  PotassiumCommandAdapterRuntimePorts
  & PotassiumCommandAdapterObjectPorts
  & PotassiumCommandAdapterBoardPorts
  & PotassiumCommandAdapterRendererPorts;

export interface PotassiumCommandAdapterOptions {
  arena: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  poisonTint: number;
  cloneRicochetMaxSpeed: number;
  bananaRicochetMinSpeed: number;
  bananaRicochetBoost: number;
  poisonDeathSpreadRadius: number;
  ghostStatusFieldLifetimeMs: number;
  ghostBeamLifetimeMs: number;
}
