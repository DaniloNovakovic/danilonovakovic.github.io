import {
  applyPotassiumDraftOption,
  applyPotassiumGenericDraftOption,
  getPotassiumDraftChoices,
  getPotassiumGenericUpgradeRank,
  getPotassiumSkillRank,
  getPotassiumWave,
  getPotassiumWaveRowSchedule,
  isPotassiumBossWave,
  POTASSIUM_ENDLESS_START_WAVE,
  type PotassiumDraftOption,
  type PotassiumEnemyKind,
  type PotassiumGenericDraftOption,
  type PotassiumGenericUpgradeKind,
  type PotassiumGenericUpgradeRanks,
  type PotassiumScheduledWaveRow,
  type PotassiumSkillRanks,
  type PotassiumUpgradeKind
} from './potassiumSlipWaves';
import type {
  PotassiumRunMode,
  PotassiumRunOutcome,
  PotassiumRunRecord
} from './potassiumSlipLeaderboard';
import { messages } from '@/shared/i18n';

export type PotassiumSessionGameState = 'START' | 'PLAYING' | 'UPGRADE' | 'WON' | 'GAME_OVER';
export type PotassiumTerminalAction = 'return' | 'retry' | 'endless';

export interface PotassiumSessionState {
  gameState: PotassiumSessionGameState;
  score: number;
  lives: number;
  wave: number;
  waveAdvancing: boolean;
  pendingRows: number;
  skillRanks: PotassiumSkillRanks;
  genericRanks: PotassiumGenericUpgradeRanks;
  runMode: PotassiumRunMode;
  runRecordCompletedAt?: string;
}

export interface PotassiumHudFacts {
  waveLabel: string;
  score: number;
  lives: number;
}

export interface PotassiumDraftChoiceView {
  option: PotassiumDraftOption;
  title: string;
  description: string;
  color: string;
}

export type PotassiumSessionCommand =
  | { type: 'resetBoard' }
  | { type: 'hideMainOverlay' }
  | { type: 'clearTerminal' }
  | { type: 'clearUpgradeChoices' }
  | { type: 'setHint'; text: string | null }
  | { type: 'spawnWave'; wave: number }
  | { type: 'spawnBoss' }
  | { type: 'scheduleWaveRows'; schedule: readonly PotassiumScheduledWaveRow[] }
  | { type: 'scheduleUpgradeChoices' }
  | { type: 'showUpgradeChoices'; choices: readonly PotassiumDraftChoiceView[] }
  | { type: 'advanceWaveAfterDelay'; wave: number }
  | { type: 'refreshProjectileVisuals' }
  | { type: 'updateHud'; hud: PotassiumHudFacts }
  | { type: 'collectCircuit' }
  | { type: 'saveRunRecord'; record: PotassiumRunRecord }
  | { type: 'showOutcome'; title: string; score: number; titleFontSize: number }
  | { type: 'showTerminal'; outcome: PotassiumRunOutcome }
  | { type: 'closeScene' }
  | { type: 'stopBanana' }
  | { type: 'clearBoardForOutcome' };

export interface PotassiumSessionResult {
  state: PotassiumSessionState;
  commands: PotassiumSessionCommand[];
}

interface PotassiumWaveClearInput {
  state: PotassiumSessionState;
  hasLivingEnemies: boolean;
}

const LIVES_INITIAL = 5;

const GENERIC_UPGRADE_CONFIGS: Record<PotassiumGenericUpgradeKind, { label: string; color: string; description: string }> = {
  damage: {
    label: messages.potassiumSlip.upgrades.generic.damage.label,
    color: '#1a1a1a',
    description: messages.potassiumSlip.upgrades.generic.damage.description
  },
  poison: {
    label: messages.potassiumSlip.upgrades.generic.poison.label,
    color: '#65a30d',
    description: messages.potassiumSlip.upgrades.generic.poison.description
  },
  explosion: {
    label: messages.potassiumSlip.upgrades.generic.explosion.label,
    color: '#ef4444',
    description: messages.potassiumSlip.upgrades.generic.explosion.description
  },
  cloneTime: {
    label: messages.potassiumSlip.upgrades.generic.cloneTime.label,
    color: '#facc15',
    description: messages.potassiumSlip.upgrades.generic.cloneTime.description
  },
  bananaSpeed: {
    label: messages.potassiumSlip.upgrades.generic.bananaSpeed.label,
    color: '#38bdf8',
    description: messages.potassiumSlip.upgrades.generic.bananaSpeed.description
  },
  bonusLife: {
    label: messages.potassiumSlip.upgrades.generic.bonusLife.label,
    color: '#a855f7',
    description: messages.potassiumSlip.upgrades.generic.bonusLife.description
  }
};

const UPGRADE_CONFIGS: Record<PotassiumUpgradeKind, { label: string; color: string; description: string }> = {
  fire: {
    label: messages.potassiumSlip.upgrades.skills.fire.label,
    color: '#f97316',
    description: messages.potassiumSlip.upgrades.skills.fire.description
  },
  poison: {
    label: messages.potassiumSlip.upgrades.skills.poison.label,
    color: '#65a30d',
    description: messages.potassiumSlip.upgrades.skills.poison.description
  },
  explosion: {
    label: messages.potassiumSlip.upgrades.skills.explosion.label,
    color: '#ef4444',
    description: messages.potassiumSlip.upgrades.skills.explosion.description
  },
  duplicate: {
    label: messages.potassiumSlip.upgrades.skills.duplicate.label,
    color: '#facc15',
    description: messages.potassiumSlip.upgrades.skills.duplicate.description
  },
  ghostHorizontal: {
    label: messages.potassiumSlip.upgrades.skills.ghostHorizontal.label,
    color: '#38bdf8',
    description: messages.potassiumSlip.upgrades.skills.ghostHorizontal.description
  },
  ghostVertical: {
    label: messages.potassiumSlip.upgrades.skills.ghostVertical.label,
    color: '#60a5fa',
    description: messages.potassiumSlip.upgrades.skills.ghostVertical.description
  }
};

export function createPotassiumSession(): PotassiumSessionState {
  return {
    gameState: 'START',
    score: 0,
    lives: LIVES_INITIAL,
    wave: 1,
    waveAdvancing: false,
    pendingRows: 0,
    skillRanks: {},
    genericRanks: {},
    runMode: 'campaign',
    runRecordCompletedAt: undefined
  };
}

export function startPotassiumCampaign(state: PotassiumSessionState): PotassiumSessionResult {
  void state;
  const nextState = {
    ...createPotassiumSession(),
    gameState: 'PLAYING' as const
  };
  return withHud(nextState, [
    { type: 'hideMainOverlay' },
    { type: 'clearTerminal' },
    { type: 'resetBoard' },
    { type: 'setHint', text: messages.potassiumSlip.hints.start },
    { type: 'spawnWave', wave: 1 }
  ]);
}

export function startPotassiumEndless(state: PotassiumSessionState): PotassiumSessionResult {
  if (state.gameState !== 'WON') return { state, commands: [] };
  const nextState: PotassiumSessionState = {
    ...state,
    gameState: 'PLAYING',
    runMode: 'endless',
    waveAdvancing: false,
    pendingRows: 0
  };
  return withHud(nextState, [
    { type: 'hideMainOverlay' },
    { type: 'clearTerminal' },
    { type: 'resetBoard' },
    { type: 'setHint', text: messages.potassiumSlip.hints.endlessStart },
    { type: 'spawnWave', wave: POTASSIUM_ENDLESS_START_WAVE }
  ]);
}

export function spawnPotassiumWave(state: PotassiumSessionState, waveNumber: number): PotassiumSessionResult {
  const wave = getPotassiumWave(waveNumber);
  const nextState: PotassiumSessionState = {
    ...state,
    wave: waveNumber,
    waveAdvancing: false,
    pendingRows: isPotassiumBossWave(waveNumber) ? 0 : wave.rows.length
  };
  if (isPotassiumBossWave(waveNumber)) {
    return withHud(nextState, [
      { type: 'spawnBoss' },
      { type: 'setHint', text: messages.potassiumSlip.hints.bossWave }
    ]);
  }
  return withHud(nextState, [
    { type: 'scheduleWaveRows', schedule: getPotassiumWaveRowSchedule(waveNumber, wave.rows) },
    { type: 'setHint', text: messages.potassiumSlip.hints.wave(wave.title, getWaveHint(waveNumber)) }
  ]);
}

export function markPotassiumRowSpawned(state: PotassiumSessionState): PotassiumSessionResult {
  return {
    state: {
      ...state,
      pendingRows: Math.max(0, state.pendingRows - 1)
    },
    commands: []
  };
}

export function resolvePotassiumWaveClear(input: PotassiumWaveClearInput): PotassiumSessionResult {
  const { state } = input;
  if (state.waveAdvancing || state.gameState !== 'PLAYING' || isPotassiumBossWave(state.wave)) {
    return { state, commands: [] };
  }
  if (state.pendingRows > 0 || input.hasLivingEnemies) {
    return { state, commands: [] };
  }
  const nextState = {
    ...state,
    waveAdvancing: true
  };
  return {
    state: nextState,
    commands: [
      { type: 'setHint', text: messages.potassiumSlip.hints.waveClear },
      { type: 'scheduleUpgradeChoices' }
    ]
  };
}

export function resolvePotassiumDevSkipWave(state: PotassiumSessionState): PotassiumSessionResult {
  if (state.gameState !== 'PLAYING' || isPotassiumBossWave(state.wave)) {
    return { state, commands: [] };
  }
  const nextState = {
    ...state,
    pendingRows: 0,
    waveAdvancing: true
  };
  return withHud(nextState, [
    { type: 'setHint', text: messages.potassiumSlip.hints.devSkip },
    { type: 'scheduleUpgradeChoices' }
  ]);
}

export function showPotassiumDraftChoices(state: PotassiumSessionState): PotassiumSessionResult {
  const choices = getPotassiumDraftChoices(state.skillRanks, state.genericRanks, state.wave);
  if (choices.length === 0) {
    return advancePotassiumWave(state);
  }
  const nextState = {
    ...state,
    gameState: 'UPGRADE' as const
  };
  return {
    state: nextState,
    commands: [
      { type: 'stopBanana' },
      { type: 'clearUpgradeChoices' },
      { type: 'showUpgradeChoices', choices: choices.map(getDraftChoiceView) }
    ]
  };
}

export function resolvePotassiumDraftChoice(
  state: PotassiumSessionState,
  option: PotassiumDraftOption
): PotassiumSessionResult {
  if (isGenericDraftOption(option)) {
    const genericRanks = applyPotassiumGenericDraftOption(state.genericRanks, option);
    const nextState = {
      ...state,
      genericRanks,
      lives: option.kind === 'bonusLife' ? state.lives + 1 : state.lives
    };
    return withHud(advancePotassiumWaveState(nextState), [
      { type: 'setHint', text: messages.potassiumSlip.hints.genericStacked(GENERIC_UPGRADE_CONFIGS[option.kind].label) },
      { type: 'clearUpgradeChoices' },
      { type: 'advanceWaveAfterDelay', wave: state.wave + 1 }
    ]);
  }

  const skillRanks = applyPotassiumDraftOption(state.skillRanks, option);
  const nextState = advancePotassiumWaveState({
    ...state,
    skillRanks
  });
  const actionLabel = option.action === 'unlock' ? 'unlocked' : 'upgraded';
  return withHud(nextState, [
    { type: 'setHint', text: messages.potassiumSlip.hints.skillApplied(UPGRADE_CONFIGS[option.kind].label, actionLabel) },
    { type: 'refreshProjectileVisuals' },
    { type: 'clearUpgradeChoices' },
    { type: 'advanceWaveAfterDelay', wave: state.wave + 1 }
  ]);
}

export function resolvePotassiumEnemyKilled(
  state: PotassiumSessionState,
  enemyScore: number,
  enemyKind: PotassiumEnemyKind
): PotassiumSessionResult {
  const nextState = {
    ...state,
    score: state.score + enemyScore
  };
  if (enemyKind === 'boss') {
    return resolvePotassiumOutcome(nextState, 'won');
  }
  return withHud(nextState);
}

export function resolvePotassiumEnemyEscaped(
  state: PotassiumSessionState,
  enemyKind: PotassiumEnemyKind
): PotassiumSessionResult {
  if (enemyKind === 'boss') {
    return resolvePotassiumOutcome({ ...state, lives: 0 }, 'game_over');
  }
  const nextState = {
    ...state,
    lives: state.lives - 1
  };
  if (nextState.lives <= 0) {
    return resolvePotassiumOutcome(nextState, 'game_over');
  }
  return withHud(nextState);
}

export function resolvePotassiumOutcome(
  state: PotassiumSessionState,
  outcome: PotassiumRunOutcome,
  completedAt: string = state.runRecordCompletedAt ?? new Date().toISOString()
): PotassiumSessionResult {
  const nextState = {
    ...state,
    gameState: outcome === 'won' ? 'WON' as const : 'GAME_OVER' as const,
    runRecordCompletedAt: completedAt
  };
  const record: PotassiumRunRecord = {
    score: nextState.score,
    wave: nextState.wave,
    mode: nextState.runMode,
    outcome,
    completedAt
  };
  const commands: PotassiumSessionCommand[] = [
    { type: 'clearBoardForOutcome' },
    { type: 'clearUpgradeChoices' }
  ];
  if (outcome === 'won' && nextState.runMode === 'campaign') {
    commands.push({ type: 'collectCircuit' });
  }
  commands.push(
    { type: 'saveRunRecord', record },
    { type: 'setHint', text: null },
    {
      type: 'showOutcome',
      title: outcome === 'won' ? messages.potassiumSlip.outcomes.won : messages.potassiumSlip.outcomes.gameOver,
      score: nextState.score,
      titleFontSize: outcome === 'won' ? 26 : 24
    },
    { type: 'showTerminal', outcome }
  );
  return { state: nextState, commands };
}

export function resolvePotassiumTerminalAction(
  state: PotassiumSessionState,
  action: PotassiumTerminalAction
): PotassiumSessionResult {
  if (action === 'return') {
    return { state, commands: [{ type: 'closeScene' }] };
  }
  if (action === 'retry') {
    return startPotassiumCampaign(state);
  }
  return startPotassiumEndless(state);
}

export function getPotassiumSessionHud(state: PotassiumSessionState): PotassiumHudFacts {
  const wave = getPotassiumWave(state.wave);
  return {
    waveLabel: messages.potassiumSlip.hud.waveLabel(state.wave, wave.title),
    score: state.score,
    lives: state.lives
  };
}

export function getPotassiumSessionSkillRank(
  state: PotassiumSessionState,
  upgrade: PotassiumUpgradeKind
): 0 | 1 | 2 {
  return getPotassiumSkillRank(state.skillRanks, upgrade);
}

export function getPotassiumSessionGenericRank(
  state: PotassiumSessionState,
  upgrade: PotassiumGenericUpgradeKind
): number {
  return getPotassiumGenericUpgradeRank(state.genericRanks, upgrade);
}

function advancePotassiumWave(state: PotassiumSessionState): PotassiumSessionResult {
  const nextState = advancePotassiumWaveState(state);
  return {
    state: nextState,
    commands: [{ type: 'advanceWaveAfterDelay', wave: state.wave + 1 }]
  };
}

function advancePotassiumWaveState(state: PotassiumSessionState): PotassiumSessionState {
  return {
    ...state,
    gameState: 'PLAYING',
    waveAdvancing: true
  };
}

function withHud(
  state: PotassiumSessionState,
  commands: PotassiumSessionCommand[] = []
): PotassiumSessionResult {
  return {
    state,
    commands: [
      ...commands,
      { type: 'updateHud', hud: getPotassiumSessionHud(state) }
    ]
  };
}

function isGenericDraftOption(option: PotassiumDraftOption): option is PotassiumGenericDraftOption {
  return option.type === 'generic';
}

function getDraftChoiceView(option: PotassiumDraftOption): PotassiumDraftChoiceView {
  const config = isGenericDraftOption(option) ? GENERIC_UPGRADE_CONFIGS[option.kind] : UPGRADE_CONFIGS[option.kind];
  return {
    option,
    title: getDraftOptionTitle(option),
    description: getDraftOptionDescription(option),
    color: config.color
  };
}

function getDraftOptionDescription(option: PotassiumDraftOption): string {
  if (isGenericDraftOption(option)) return GENERIC_UPGRADE_CONFIGS[option.kind].description;
  if (option.kind === 'fire') {
    return option.action === 'unlock'
      ? messages.potassiumSlip.upgrades.skills.fire.unlockDescription
      : messages.potassiumSlip.upgrades.skills.fire.upgradeDescription;
  }
  if (option.kind === 'poison') {
    return option.action === 'unlock'
      ? messages.potassiumSlip.upgrades.skills.poison.unlockDescription
      : messages.potassiumSlip.upgrades.skills.poison.upgradeDescription;
  }
  if (option.kind === 'explosion') {
    return option.action === 'unlock'
      ? messages.potassiumSlip.upgrades.skills.explosion.unlockDescription
      : messages.potassiumSlip.upgrades.skills.explosion.upgradeDescription;
  }
  if (option.kind === 'duplicate') {
    return option.action === 'unlock'
      ? messages.potassiumSlip.upgrades.skills.duplicate.unlockDescription
      : messages.potassiumSlip.upgrades.skills.duplicate.upgradeDescription;
  }
  if (option.kind === 'ghostHorizontal') {
    return option.action === 'unlock'
      ? messages.potassiumSlip.upgrades.skills.ghostHorizontal.unlockDescription
      : messages.potassiumSlip.upgrades.skills.ghostHorizontal.upgradeDescription;
  }
  return option.action === 'unlock'
    ? messages.potassiumSlip.upgrades.skills.ghostVertical.unlockDescription
    : messages.potassiumSlip.upgrades.skills.ghostVertical.upgradeDescription;
}

function getDraftOptionTitle(option: PotassiumDraftOption): string {
  if (isGenericDraftOption(option)) return GENERIC_UPGRADE_CONFIGS[option.kind].label;
  const label = UPGRADE_CONFIGS[option.kind].label;
  return option.action === 'upgrade' ? messages.potassiumSlip.upgrades.upgradedTitle(label) : label;
}

function getWaveHint(wave: number): string {
  if (wave > 11) return messages.potassiumSlip.waveHints.endlessEscalation;
  if (wave === 1) return messages.potassiumSlip.waveHints.launchAndBounce;
  if (wave === 2) return messages.potassiumSlip.waveHints.multiHitBlobs;
  if (wave === 3) return messages.potassiumSlip.waveHints.wallsBlockAngles;
  if (wave === 4) return messages.potassiumSlip.waveHints.wallsBlockAngles;
  if (wave === 5) return messages.potassiumSlip.waveHints.splitterMemos;
  if (wave === 6) return messages.potassiumSlip.waveHints.stackChoices;
  if (wave === 7) return messages.potassiumSlip.waveHints.shieldPlates;
  if (wave >= 8 && wave <= 10) return messages.potassiumSlip.waveHints.hardWalls;
  return messages.potassiumSlip.waveHints.bossTime;
}
