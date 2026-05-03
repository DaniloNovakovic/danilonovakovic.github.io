import {
  applyPotassiumDraftOption,
  applyPotassiumGenericDraftOption,
  getPotassiumDraftChoices,
  getPotassiumGenericUpgradeRank,
  getPotassiumSkillRank,
  getPotassiumWave,
  isPotassiumBossWave,
  POTASSIUM_ENDLESS_START_WAVE,
  type PotassiumDraftOption,
  type PotassiumEnemyKind,
  type PotassiumGenericDraftOption,
  type PotassiumGenericUpgradeKind,
  type PotassiumGenericUpgradeRanks,
  type PotassiumSkillRanks,
  type PotassiumUpgradeKind,
  type PotassiumWaveCell
} from './potassiumSlipWaves';
import type {
  PotassiumRunMode,
  PotassiumRunOutcome,
  PotassiumRunRecord
} from './potassiumSlipLeaderboard';

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
  | { type: 'scheduleWaveRows'; rows: readonly PotassiumWaveCell[][] }
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
    label: 'Damage +',
    color: '#1a1a1a',
    description: '+12% banana and beam damage.'
  },
  poison: {
    label: 'Poison +',
    color: '#65a30d',
    description: '+10% poison tick strength.'
  },
  explosion: {
    label: 'Explosion +',
    color: '#ef4444',
    description: '+6% blast radius.'
  },
  cloneTime: {
    label: 'Clone Time +',
    color: '#facc15',
    description: '+300ms clone lifetime.'
  },
  bananaSpeed: {
    label: 'Banana Speed +',
    color: '#38bdf8',
    description: '+5% launch speed.'
  },
  bonusLife: {
    label: 'Bonus Life',
    color: '#a855f7',
    description: '+1 life right now.'
  }
};

const UPGRADE_CONFIGS: Record<PotassiumUpgradeKind, { label: string; color: string; description: string }> = {
  fire: {
    label: 'Fire Trail',
    color: '#f97316',
    description: 'Moving bananas leave hot nonsense.'
  },
  poison: {
    label: 'Poison Damage',
    color: '#65a30d',
    description: 'Hits tick for 1 dmg every 500ms.'
  },
  explosion: {
    label: 'Explosion Damage',
    color: '#ef4444',
    description: 'Every hit pops nearby paperwork.'
  },
  duplicate: {
    label: 'Duplicate',
    color: '#facc15',
    description: 'Main hits spawn two tiny bananas.'
  },
  ghostHorizontal: {
    label: 'Horizontal Ghost',
    color: '#38bdf8',
    description: 'Hits sweep a blue row beam.'
  },
  ghostVertical: {
    label: 'Vertical Ghost',
    color: '#60a5fa',
    description: 'Hits sweep a blue column beam.'
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
    { type: 'setHint', text: 'Drag toward a target • Hold to recall' },
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
    { type: 'setHint', text: 'Endless audit • The nonsense keeps filing' },
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
      { type: 'setHint', text: 'Boss wave • Stop the audit before it lands' }
    ]);
  }
  return withHud(nextState, [
    { type: 'scheduleWaveRows', rows: wave.rows },
    { type: 'setHint', text: `${wave.title}: ${getWaveHint(waveNumber)}` }
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
      { type: 'setHint', text: 'Wave clear • Choose fresh banana nonsense' },
      { type: 'scheduleUpgradeChoices' }
    ]
  };
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
      { type: 'setHint', text: `${GENERIC_UPGRADE_CONFIGS[option.kind].label} stacked • Endless paperwork trembles` },
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
    { type: 'setHint', text: `${UPGRADE_CONFIGS[option.kind].label} ${actionLabel} • It stacks forever` },
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
      title: outcome === 'won' ? 'CIRCUIT ACQUIRED' : 'BANANA BANKRUPTCY',
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
    waveLabel: `W${state.wave} ${wave.title}`,
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
    waveAdvancing: false
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
      ? 'Moving bananas leave fire.'
      : 'Hits drop extra fire patches.';
  }
  if (option.kind === 'poison') {
    return option.action === 'unlock'
      ? 'Hits poison enemies over time.'
      : 'Poisoned enemies spread on death.';
  }
  if (option.kind === 'explosion') {
    return option.action === 'unlock'
      ? 'Hits explode with falloff damage.'
      : 'Bigger blasts apply statuses.';
  }
  if (option.kind === 'duplicate') {
    return option.action === 'unlock'
      ? 'Main hits spawn 2 small bananas.'
      : 'Clones apply half-strength procs and spawn +1.';
  }
  if (option.kind === 'ghostHorizontal') {
    return option.action === 'unlock'
      ? 'Hits fire a blue row beam.'
      : 'Row beams apply statuses.';
  }
  return option.action === 'unlock'
    ? 'Hits fire a blue column beam.'
    : 'Column beams apply statuses.';
}

function getDraftOptionTitle(option: PotassiumDraftOption): string {
  if (isGenericDraftOption(option)) return GENERIC_UPGRADE_CONFIGS[option.kind].label;
  const label = UPGRADE_CONFIGS[option.kind].label;
  return option.action === 'upgrade' ? `${label} +` : label;
}

function getWaveHint(wave: number): string {
  if (wave > 11) return 'endless paperwork escalation';
  if (wave === 1) return 'launch and bounce';
  if (wave === 2) return 'multi-hit blobs';
  if (wave === 3) return 'walls block angles';
  if (wave === 4) return 'walls block angles';
  if (wave === 5) return 'splitter memos make smaller problems';
  if (wave === 6) return 'stack your choices';
  if (wave === 7) return 'shield plates reject bad angles';
  if (wave >= 8 && wave <= 10) return 'hard walls ignore banana law';
  return 'boss time';
}
