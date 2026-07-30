// Session dispatch mirrors many console verbs; complexity is the command surface.
// fallow-ignore-file complexity
import {
  createRidgeRouteStages,
  RidgeConsoleSession,
  type RidgeRouteDialogueCatalog,
  type RidgeSessionEvent
} from '../ridge/index';
import {
  interactBasement,
  moveBasement,
  returnToOverworld,
  syncBasementPosition
} from './basementLogic';
import { getGameHelpText, parseGameCommand, parseGameScript } from './commands';
import {
  OVERWORLD_GROUND_Y,
  OVERWORLD_PLAYER_START,
  type GameSceneId
} from './content/overworldSpots';
import { interactHobbies, moveHobbies } from './hobbiesLogic';
import { formatGameObservation, observeGameWorld } from './observe';
import { draftPotassium, fightPotassium, startPotassium } from './potassiumLogic';
import {
  enterPotassiumFromBananaPeel,
  interactOverworld,
  moveOverworld,
  syncOverworldPosition
} from './overworldLogic';
import type {
  GameCommand,
  GameCommandResult,
  GameItemId,
  GameObservation,
  GameSecretId,
  GameSessionEvent,
  GameWorldState
} from './types';

export interface GameConsoleSessionOptions {
  dialogue: RidgeRouteDialogueCatalog;
  /** Start scene (default overworld). */
  sceneId?: GameSceneId;
  ownedItemIds?: readonly GameItemId[];
  equippedItemIds?: readonly GameItemId[];
  discoveredSecretIds?: readonly GameSecretId[];
}

export class GameConsoleSession {
  private state: GameWorldState;
  private ridge: RidgeConsoleSession | null = null;
  private readonly dialogue: RidgeRouteDialogueCatalog;

  constructor(options: GameConsoleSessionOptions) {
    this.dialogue = options.dialogue;
    const owned = [...(options.ownedItemIds ?? [])];
    const equipped = [...(options.equippedItemIds ?? [])];
    const secrets = [...(options.discoveredSecretIds ?? [])];
    const sceneId = options.sceneId ?? 'overworld';

    this.state = {
      mode: modeForScene(sceneId),
      sceneId,
      overlay: null,
      ownedItemIds: owned,
      equippedItemIds: equipped,
      discoveredSecretIds: secrets,
      overworld: {
        playerX: OVERWORLD_PLAYER_START.x,
        playerY: OVERWORLD_GROUND_Y,
        facing: 'right',
        bananaFirstPeelPending: false
      },
      basement: { playerX: 135, facing: 'right' },
      hobbies: { playerX: 200, facing: 'right' },
      potassium: {
        phase: 'lobby',
        wave: 0,
        maxWaves: 5,
        lives: 3,
        score: 0,
        draftChoices: []
      },
      lastMessage: null,
      ridgeBeat: null
    };

    if (sceneId === 'ridge') {
      this.ensureRidge();
    }
  }

  getState(): GameWorldState {
    return this.state;
  }

  observe(): GameObservation {
    return observeGameWorld(this.state, this.ridge?.observe() ?? null);
  }

  // Used by scripts/game-console.ts (CLI entry; not always visible to graph analysis).
  // fallow-ignore-next-line unused-class-member
  format(): string {
    return formatGameObservation(this.observe());
  }

  exec(raw: string): GameCommandResult {
    return this.run(parseGameCommand(raw));
  }

  // fallow-ignore-next-line unused-class-member
  execScript(script: string): GameCommandResult[] {
    return parseGameScript(script).map((command) => this.run(command));
  }

  /**
   * Phaser-authoritative position sync. Physics/jump stay in the scene;
   * the session only needs coords for nearby/gating decisions.
   */
  syncPlayerPosition(x: number, y?: number): GameCommandResult {
    if (this.state.mode === 'overworld') {
      const events = syncOverworldPosition(this.state, x, y ?? this.state.overworld.playerY);
      return this.finish('Synced overworld position.', events);
    }
    if (this.state.mode === 'basement') {
      syncBasementPosition(this.state, x);
      return this.ok('Synced basement position.');
    }
    if (this.state.mode === 'hobbies') {
      this.state.hobbies.playerX = x;
      return this.ok('Synced hobbies position.');
    }
    return this.ok('Position sync ignored outside walk modes.');
  }

  /** Live Overworld typewriter warp entry into Potassium. */
  commitBananaPeelWarp(): GameCommandResult {
    if (this.state.mode !== 'overworld') {
      return this.fail('Banana peel warp only applies on the street.');
    }
    const result = enterPotassiumFromBananaPeel(this.state);
    return this.finish(result.message, result.events);
  }

  /**
   * Phaser overlays pause the street without leaving the Overworld scene.
   * After applying `overlay_opened`, restore explore mode so nearby stays valid.
   */
  restoreExploreAfterOverlay(): void {
    if (this.state.mode !== 'overlay') return;
    this.state.overlay = null;
    if (this.state.sceneId === 'basement') {
      this.state.mode = 'basement';
    } else if (this.state.sceneId === 'hobbies') {
      this.state.mode = 'hobbies';
    } else {
      this.state.mode = 'overworld';
      this.state.sceneId = 'overworld';
    }
  }

  run(command: GameCommand): GameCommandResult {
    switch (command.type) {
      case 'help':
        return this.ok(getGameHelpText());
      case 'look':
      case 'status':
        return this.ok(command.type === 'look' ? 'You take in the scene.' : 'Status.');
      case 'inventory':
        return this.ok(
          this.state.ownedItemIds.length > 0
            ? `Inventory: ${this.state.ownedItemIds.join(', ')} (equipped: ${
                this.state.equippedItemIds.join(', ') || 'none'
              })`
            : 'Inventory is empty.'
        );
      case 'equip':
        return this.handleEquip(command.itemId);
      case 'unequip':
        return this.handleUnequip(command.itemId);
      case 'cheat':
        return this.handleCheatGive(command.itemId);
      case 'go':
        return this.handleGo(command.direction, command.steps ?? 1);
      case 'interact':
        return this.handleInteract(command.target);
      case 'close':
      case 'leave':
        return this.handleCloseOrLeave(command.type);
      case 'advance':
      case 'choose':
        return this.handleRidgeTalk(command);
      case 'skip':
        return this.handleRidgeSkipWarp('skip');
      case 'warp':
        return this.handleRidgeSkipWarp(`warp ${command.areaId}`);
      case 'start':
        return this.wrapPotassium(startPotassium(this.state));
      case 'fight':
        return this.wrapPotassium(fightPotassium(this.state));
      case 'draft':
        return this.wrapPotassium(draftPotassium(this.state, command.choiceIdOrIndex));
      case 'unknown':
        return this.fail(
          command.raw
            ? `Unknown command "${command.raw}". Type help.`
            : 'Empty command. Type help.'
        );
    }
  }

  private handleRidgeSkipWarp(raw: string): GameCommandResult {
    if (this.state.mode !== 'ridge') {
      return this.fail('skip / warp only work inside Ridge.');
    }
    return this.forwardRidge(raw);
  }

  private handleGo(direction: 'left' | 'right', steps: number): GameCommandResult {
    if (this.state.mode === 'overlay') {
      return this.fail('Close the overlay first (close).');
    }
    if (this.state.mode === 'potassium') {
      return this.fail('Potassium is turn-based here. Use start / fight / draft.');
    }
    if (this.state.mode === 'ridge') {
      return this.forwardRidge(`go ${direction} ${steps}`);
    }

    if (this.state.mode === 'basement') {
      return this.ok(moveBasement(this.state, direction, steps));
    }
    if (this.state.mode === 'hobbies') {
      return this.ok(moveHobbies(this.state, direction, steps));
    }
    const walked = moveOverworld(this.state, direction, steps);
    return this.finish(walked.message, walked.events);
  }

  private handleInteract(target: string | undefined): GameCommandResult {
    if (this.state.mode === 'overlay') {
      return this.fail('Overlay open — type close, or read with look.');
    }
    if (this.state.mode === 'potassium') {
      return this.fail('In Potassium use start / fight / draft (or close to bail).');
    }
    if (this.state.mode === 'ridge') {
      return this.forwardRidge(target ? `interact ${target}` : 'interact');
    }

    if (this.state.mode === 'basement') {
      const result = interactBasement(this.state, target);
      return this.finish(result.message, result.events);
    }
    if (this.state.mode === 'hobbies') {
      const result = interactHobbies(this.state, target);
      return this.finish(result.message, result.events);
    }

    const result = interactOverworld(this.state, target);
    if (result.events.some((e) => e.type === 'scene_entered' && e.sceneId === 'ridge')) {
      this.ensureRidge();
    }
    return this.finish(result.message, result.events);
  }

  private handleCloseOrLeave(kind: 'close' | 'leave'): GameCommandResult {
    if (this.state.mode === 'ridge') {
      if (kind === 'leave') {
        return this.forwardRidge('leave');
      }
      // close from Ridge returns to overworld (eject the Circuit fantasy)
      this.ridge = null;
      this.state.mode = 'overworld';
      this.state.sceneId = 'overworld';
      this.state.ridgeBeat = null;
      return this.finish('You pull the Circuit. The CRT goes dark — back on the street.', [
        { type: 'scene_returned', sceneId: 'overworld' }
      ]);
    }

    if (this.state.mode === 'overlay') {
      const overlayId = this.state.overlay?.id ?? 'unknown';
      const returnScene = this.state.sceneId;
      this.state.overlay = null;
      this.state.mode =
        returnScene === 'basement'
          ? 'basement'
          : returnScene === 'hobbies'
            ? 'hobbies'
            : 'overworld';
      return this.finish(`Closed ${overlayId}.`, [{ type: 'overlay_closed', overlayId }]);
    }

    if (this.state.mode === 'basement' || this.state.mode === 'hobbies' || this.state.mode === 'potassium') {
      const leavingPotassium = this.state.mode === 'potassium';
      const result = returnToOverworld(
        this.state,
        leavingPotassium
          ? 'You bail out of Potassium Slip back to the street.'
          : 'You return to the street.'
      );
      if (leavingPotassium) {
        this.state.potassium.phase = 'lobby';
      }
      return this.finish(result.message, result.events);
    }

    return this.fail('Nothing to close.');
  }

  private handleRidgeTalk(
    command: Extract<GameCommand, { type: 'advance' } | { type: 'choose' }>
  ): GameCommandResult {
    if (this.state.mode !== 'ridge') {
      return this.fail('Conversation commands only work inside Ridge.');
    }
    if (command.type === 'advance') return this.forwardRidge('advance');
    return this.forwardRidge(`choose ${command.choiceIdOrIndex}`);
  }

  private handleEquip(itemId: GameItemId): GameCommandResult {
    if (!this.state.ownedItemIds.includes(itemId)) {
      return this.fail(`You do not own ${itemId}.`);
    }
    if (this.state.equippedItemIds.includes(itemId)) {
      return this.ok(`${itemId} already equipped.`);
    }
    this.state.equippedItemIds = [...this.state.equippedItemIds, itemId];
    return this.finish(`Equipped ${itemId}.`, [{ type: 'item_equipped', itemId }]);
  }

  private handleUnequip(itemId: GameItemId): GameCommandResult {
    if (!this.state.equippedItemIds.includes(itemId)) {
      return this.fail(`${itemId} is not equipped.`);
    }
    this.state.equippedItemIds = this.state.equippedItemIds.filter((id) => id !== itemId);
    return this.finish(`Unequipped ${itemId}.`, [{ type: 'item_unequipped', itemId }]);
  }

  private handleCheatGive(itemId: GameItemId): GameCommandResult {
    const events: GameSessionEvent[] = [];
    if (!this.state.ownedItemIds.includes(itemId)) {
      this.state.ownedItemIds = [...this.state.ownedItemIds, itemId];
      events.push({ type: 'item_collected', itemId });
    }
    if (itemId === 'glasses' && !this.state.equippedItemIds.includes('glasses')) {
      this.state.equippedItemIds = [...this.state.equippedItemIds, 'glasses'];
      events.push({ type: 'item_equipped', itemId: 'glasses' });
    }
    if (itemId === 'glasses' && !this.state.discoveredSecretIds.includes('banana-peel-clue')) {
      // cheat does not auto-discover peel
    }
    return this.finish(`Cheat: now own ${itemId}.`, events);
  }

  private forwardRidge(raw: string): GameCommandResult {
    const ridge = this.ensureRidge();
    const result = ridge.exec(raw);
    const events = mapRidgeEvents(result.events);
    this.state.ridgeBeat = ridge.observe().beat;
    this.state.lastMessage = result.message;
    return {
      ok: result.ok,
      message: result.message,
      observation: this.observe(),
      events
    };
  }

  private ensureRidge(): RidgeConsoleSession {
    if (!this.ridge) {
      this.ridge = new RidgeConsoleSession({
        stages: createRidgeRouteStages(this.dialogue)
      });
    }
    return this.ridge;
  }

  private wrapPotassium(result: {
    ok: boolean;
    message: string;
    events: GameSessionEvent[];
  }): GameCommandResult {
    return result.ok ? this.finish(result.message, result.events) : this.fail(result.message);
  }

  private ok(message: string, events: readonly GameSessionEvent[] = []): GameCommandResult {
    return this.finish(message, events);
  }

  private fail(message: string): GameCommandResult {
    this.state.lastMessage = message;
    return {
      ok: false,
      message,
      observation: this.observe(),
      events: []
    };
  }

  private finish(message: string, events: readonly GameSessionEvent[]): GameCommandResult {
    this.state.lastMessage = message;
    return {
      ok: true,
      message,
      observation: this.observe(),
      events
    };
  }
}

function mapRidgeEvents(events: readonly RidgeSessionEvent[]): GameSessionEvent[] {
  const out: GameSessionEvent[] = [];
  for (const event of events) {
    if (event.type === 'beat_changed') {
      out.push({ type: 'ridge_beat_changed', beat: event.beat });
    } else if (event.type === 'area_handoff') {
      out.push({ type: 'ridge_area_handoff', areaId: event.areaId });
    } else if (event.type === 'route_reset') {
      out.push({ type: 'ridge_route_reset' });
    }
  }
  return out;
}

function modeForScene(sceneId: GameSceneId): GameWorldState['mode'] {
  switch (sceneId) {
    case 'basement':
    case 'hobbies':
    case 'potassium':
    case 'ridge':
    case 'overworld':
      return sceneId;
    case 'stampedeSketch':
      // Not console-backed yet; land on overworld with a clear observation.
      return 'overworld';
  }
}
