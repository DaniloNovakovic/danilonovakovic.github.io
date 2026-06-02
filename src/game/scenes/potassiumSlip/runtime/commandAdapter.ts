import type { PotassiumBossCommand } from './boss';
import type { PotassiumCombatCommand, PotassiumDamageSource } from './combat';
import type { PotassiumSessionCommand, PotassiumSessionResult } from './session';
import { applyBossCommands as applyBossCommandsModule } from './commandAdapterBoss';
import {
  applyCombatCommands as applyCombatCommandsModule,
  damageEnemy as damageEnemyModule
} from './commandAdapterCombat';
import { PotassiumCommandAdapterInternals } from './commandAdapterInternals';
import { applySessionCommands as applySessionCommandsModule } from './commandAdapterSession';
import type {
  PotassiumCombatContext,
  PotassiumCommandAdapterOptions,
  PotassiumCommandAdapterPorts,
  PotassiumCommandObject
} from './commandAdapterTypes';

export type {
  PotassiumCombatContext,
  PotassiumCommandAdapterBoardPorts,
  PotassiumCommandAdapterObjectPorts,
  PotassiumCommandAdapterOptions,
  PotassiumCommandAdapterPorts,
  PotassiumCommandAdapterRendererPorts,
  PotassiumCommandAdapterRuntimePorts,
  PotassiumCommandBody,
  PotassiumCommandObject
} from './commandAdapterTypes';

export class PotassiumCommandAdapter {
  private readonly internals: PotassiumCommandAdapterInternals;

  constructor(ports: PotassiumCommandAdapterPorts, options: PotassiumCommandAdapterOptions) {
    this.internals = new PotassiumCommandAdapterInternals(ports, options);
    this.internals.delegates = {
      applySessionResult: (result) => this.applySessionResult(result),
      applyCombatCommands: (commands, context) => this.applyCombatCommands(commands, context)
    };
  }

  resetCombatIds(): void {
    this.internals.resetCombatIds();
  }

  applySessionResult(result: PotassiumSessionResult): void {
    this.internals.ports.applySessionResult({
      state: result.state,
      commands: []
    });
    applySessionCommandsModule(this.internals, result.commands);
  }

  applySessionCommands(commands: readonly PotassiumSessionCommand[]): void {
    applySessionCommandsModule(this.internals, commands);
  }

  getEnemyCombatFacts(enemy: PotassiumCommandObject) {
    return this.internals.getEnemyCombatFacts(enemy);
  }

  getProjectileCombatFacts(projectile: PotassiumCommandObject) {
    return this.internals.getProjectileCombatFacts(projectile);
  }

  getBossFacts(boss: PotassiumCommandObject) {
    return this.internals.getBossFacts(boss);
  }

  createCombatContext(
    enemies?: PotassiumCommandObject[],
    projectiles?: PotassiumCommandObject[]
  ): PotassiumCombatContext {
    return this.internals.createCombatContext(enemies, projectiles);
  }

  applyCombatCommands(
    commands: readonly PotassiumCombatCommand[],
    context?: PotassiumCombatContext
  ): void {
    applyCombatCommandsModule(this.internals, commands, context);
  }

  damageEnemy(enemy: PotassiumCommandObject, amount: number, source: PotassiumDamageSource): void {
    damageEnemyModule(this.internals, enemy, amount, source);
  }

  applyBossCommands(commands: readonly PotassiumBossCommand[], boss?: PotassiumCommandObject): void {
    applyBossCommandsModule(this.internals, commands, boss);
  }
}
