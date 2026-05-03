import type {
  PotassiumEnemyHealthState,
  PotassiumEnemyKind,
  PotassiumShieldSide
} from './potassiumSlipWaves';

export interface PotassiumDataObject {
  getData(key: string): unknown;
  setData(key: string, value: unknown): unknown;
}

export const POTASSIUM_DATA_KEYS = {
  angularVelocity: 'angularVelocity',
  bananaVisuals: 'bananaVisuals',
  canApplyHitProcs: 'canApplyHitProcs',
  canDuplicate: 'canDuplicate',
  columnIndex: 'columnIndex',
  columnSpan: 'columnSpan',
  combatId: 'combatId',
  damageCueBaseScaleX: 'damageCueBaseScaleX',
  damageCueBaseScaleY: 'damageCueBaseScaleY',
  damageCueTween: 'damageCueTween',
  damageOverlay: 'damageOverlay',
  damageState: 'damageState',
  dying: 'dying',
  effectMultiplier: 'effectMultiplier',
  fireTickUntil: 'fireTickUntil',
  hp: 'hp',
  indestructible: 'indestructible',
  kind: 'kind',
  labelText: 'labelText',
  maxHp: 'maxHp',
  nextTrailDropAt: 'nextTrailDropAt',
  occupiedColumns: 'occupiedColumns',
  orbitIndex: 'orbitIndex',
  poisonExpiresAt: 'poisonExpiresAt',
  poisonMultiplier: 'poisonMultiplier',
  poisonNextTickAt: 'poisonNextTickAt',
  poisoned: 'poisoned',
  recallVisual: 'recallVisual',
  rowIndex: 'rowIndex',
  shieldPlate: 'shieldPlate',
  shieldSide: 'shieldSide',
  splitsOnDeath: 'splitsOnDeath',
  stoneActive: 'stoneActive',
  stoneUntil: 'stoneUntil',
  bossPhase: 'bossPhase'
} as const;

export function getPotassiumData<T>(object: PotassiumDataObject, key: string): T | undefined {
  return object.getData(key) as T | undefined;
}

export function setPotassiumData(object: PotassiumDataObject, key: string, value: unknown): void {
  object.setData(key, value);
}

export function getPotassiumHitCooldownKey(hitKey: string): string {
  return `hitUntil:${hitKey}`;
}

export function getPotassiumHitCooldownUntil(object: PotassiumDataObject, hitKey: string): number | undefined {
  return getPotassiumData<number>(object, getPotassiumHitCooldownKey(hitKey));
}

export function setPotassiumHitCooldownUntil(object: PotassiumDataObject, hitKey: string, until: number): void {
  setPotassiumData(object, getPotassiumHitCooldownKey(hitKey), until);
}

export function getPotassiumCombatId(object: PotassiumDataObject): string | undefined {
  return getPotassiumData<string>(object, POTASSIUM_DATA_KEYS.combatId);
}

export function setPotassiumCombatId(object: PotassiumDataObject, id: string): void {
  setPotassiumData(object, POTASSIUM_DATA_KEYS.combatId, id);
}

export function getPotassiumEnemyKind(object: PotassiumDataObject): PotassiumEnemyKind {
  return getPotassiumData<PotassiumEnemyKind>(object, POTASSIUM_DATA_KEYS.kind) ?? 'intern';
}

export function isPotassiumEnemyDying(object: PotassiumDataObject): boolean {
  return Boolean(getPotassiumData<boolean>(object, POTASSIUM_DATA_KEYS.dying));
}

export function setPotassiumEnemyDying(object: PotassiumDataObject, dying: boolean): void {
  setPotassiumData(object, POTASSIUM_DATA_KEYS.dying, dying);
}

export function getPotassiumEnemyHp(object: PotassiumDataObject): number {
  return getPotassiumData<number>(object, POTASSIUM_DATA_KEYS.hp) ?? 0;
}

export function getPotassiumEnemyMaxHp(object: PotassiumDataObject): number {
  return getPotassiumData<number>(object, POTASSIUM_DATA_KEYS.maxHp) ?? 0;
}

export function setPotassiumEnemyHp(object: PotassiumDataObject, hp: number): void {
  setPotassiumData(object, POTASSIUM_DATA_KEYS.hp, hp);
}

export function setPotassiumEnemyMaxHp(object: PotassiumDataObject, maxHp: number): void {
  setPotassiumData(object, POTASSIUM_DATA_KEYS.maxHp, maxHp);
}

export function setPotassiumEnemyHealth(
  object: PotassiumDataObject,
  hp: number,
  damageState: PotassiumEnemyHealthState
): void {
  setPotassiumEnemyHp(object, hp);
  setPotassiumData(object, POTASSIUM_DATA_KEYS.damageState, damageState);
}

export function getPotassiumShieldSide(object: PotassiumDataObject): PotassiumShieldSide | undefined {
  return getPotassiumData<PotassiumShieldSide>(object, POTASSIUM_DATA_KEYS.shieldSide);
}

export function getPotassiumProjectileEffectMultiplier(object: PotassiumDataObject): number {
  return getPotassiumData<number>(object, POTASSIUM_DATA_KEYS.effectMultiplier) ?? 1;
}

export function canPotassiumProjectileApplyHitProcs(object: PotassiumDataObject): boolean {
  return getPotassiumData<boolean>(object, POTASSIUM_DATA_KEYS.canApplyHitProcs) ?? false;
}

export function canPotassiumProjectileDuplicate(object: PotassiumDataObject): boolean {
  return Boolean(getPotassiumData<boolean>(object, POTASSIUM_DATA_KEYS.canDuplicate));
}

export function getPotassiumProjectileNextTrailDropAt(object: PotassiumDataObject): number {
  return getPotassiumData<number>(object, POTASSIUM_DATA_KEYS.nextTrailDropAt) ?? 0;
}

export function setPotassiumProjectileNextTrailDropAt(object: PotassiumDataObject, nextTrailDropAt: number): void {
  setPotassiumData(object, POTASSIUM_DATA_KEYS.nextTrailDropAt, nextTrailDropAt);
}

export function isPotassiumProjectileRecallVisual(object: PotassiumDataObject): boolean {
  return getPotassiumData<boolean>(object, POTASSIUM_DATA_KEYS.recallVisual) ?? false;
}

export function setPotassiumProjectileDefaults(
  object: PotassiumDataObject,
  input: {
    canDuplicate: boolean;
    effectMultiplier: number;
    canApplyHitProcs: boolean;
    nextTrailDropAt?: number;
    recallVisual?: boolean;
  }
): void {
  setPotassiumData(object, POTASSIUM_DATA_KEYS.canDuplicate, input.canDuplicate);
  setPotassiumData(object, POTASSIUM_DATA_KEYS.effectMultiplier, input.effectMultiplier);
  setPotassiumData(object, POTASSIUM_DATA_KEYS.canApplyHitProcs, input.canApplyHitProcs);
  if (input.nextTrailDropAt !== undefined) {
    setPotassiumProjectileNextTrailDropAt(object, input.nextTrailDropAt);
  }
  if (input.recallVisual !== undefined) {
    setPotassiumData(object, POTASSIUM_DATA_KEYS.recallVisual, input.recallVisual);
  }
}
