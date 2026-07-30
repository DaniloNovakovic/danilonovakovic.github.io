#!/usr/bin/env node
/**
 * Headless full-game console for humans and AI agents.
 *
 * Interactive:
 *   pnpm game:console
 *
 * One-shot script (semicolon-separated):
 *   pnpm game:console --script "look; go right 3; interact"
 *
 * JSON observation stream:
 *   pnpm game:console --script "look" --json
 *
 * Start inside Ridge (skip street):
 *   pnpm game:console --scene ridge
 */
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import {
  GameConsoleSession,
  type GameCommandResult,
  type GameSceneId,
  formatGameObservation
} from '../src/game/core/console/index';
import type { BridgeDialogueCatalog } from '../src/game/core/ridge/index';
import { enMessages } from '../src/shared/i18n/messages/en';

function loadCatalog(): BridgeDialogueCatalog {
  const bridge = enMessages.scenes.ridge.bridge;
  return {
    speakers: {
      prompt: bridge.speakers.prompt,
      cicka: bridge.speakers.cicka,
      bridgeDraftsperson: bridge.speakers.bridgeDraftsperson
    },
    lines: { ...bridge.dialogue }
  };
}

function parseScene(args: string[]): GameSceneId {
  const index = args.indexOf('--scene');
  const raw = index >= 0 ? args[index + 1] : 'overworld';
  const allowed: GameSceneId[] = [
    'overworld',
    'basement',
    'hobbies',
    'potassium',
    'ridge',
    'stampedeSketch'
  ];
  if (raw && (allowed as string[]).includes(raw)) return raw as GameSceneId;
  return 'overworld';
}

function createSession(sceneId: GameSceneId): GameConsoleSession {
  return new GameConsoleSession({
    dialogue: loadCatalog(),
    sceneId
  });
}

function printResult(result: GameCommandResult, asJson: boolean): void {
  if (asJson) {
    output.write(
      `${JSON.stringify(
        {
          ok: result.ok,
          message: result.message,
          events: result.events,
          observation: result.observation
        },
        null,
        2
      )}\n`
    );
    return;
  }

  output.write(`\n${result.message}\n\n`);
  output.write(`${formatGameObservation(result.observation)}\n`);
}

async function runScript(
  script: string,
  asJson: boolean,
  sceneId: GameSceneId
): Promise<number> {
  const session = createSession(sceneId);
  const results = session.execScript(script);
  for (const result of results) {
    printResult(result, asJson);
  }
  if (results.length === 0) {
    printResult(session.exec('look'), asJson);
  }
  return 0;
}

async function runRepl(asJson: boolean, sceneId: GameSceneId): Promise<number> {
  const session = createSession(sceneId);
  const rl = readline.createInterface({ input, output });

  output.write('Game Console — Overworld / Basement / Potassium / Ridge\n');
  output.write('Type help. Ctrl+C or quit to exit.\n\n');
  output.write(`${session.format()}\n`);

  while (true) {
    const answer = await rl.question('\ngame> ');
    const trimmed = answer.trim();
    if (!trimmed) continue;
    if (trimmed === 'quit' || trimmed === 'exit') break;

    if (trimmed.includes(';')) {
      for (const result of session.execScript(trimmed)) {
        printResult(result, asJson);
      }
      continue;
    }

    printResult(session.exec(trimmed), asJson);
  }

  rl.close();
  return 0;
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const sceneId = parseScene(args);
  const scriptIndex = args.indexOf('--script');
  const script = scriptIndex >= 0 ? args[scriptIndex + 1] : undefined;

  if (script) {
    return runScript(script, asJson, sceneId);
  }

  if (!input.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of input) {
      chunks.push(Buffer.from(chunk));
    }
    const scriptFromStdin = Buffer.concat(chunks).toString('utf8').trim();
    if (!scriptFromStdin) {
      output.write('No commands on stdin. Example: echo "look; help" | pnpm game:console\n');
      return 1;
    }
    return runScript(scriptFromStdin, asJson, sceneId);
  }

  return runRepl(asJson, sceneId);
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
