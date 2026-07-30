#!/usr/bin/env node
/**
 * Headless Ridge console for humans and AI agents.
 *
 * Interactive:
 *   pnpm ridge:console
 *
 * One-shot script (semicolon-separated):
 *   pnpm ridge:console --script "look; go right 3; interact; advance"
 *
 * JSON observation stream (machine-friendly):
 *   pnpm ridge:console --script "look" --json
 */
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import {
  createBridgeStage,
  RidgeConsoleSession,
  formatObservation,
  type BridgeDialogueCatalog,
  type RidgeCommandResult
} from '../src/game/core/ridge/index';
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

function createSession(): RidgeConsoleSession {
  return new RidgeConsoleSession({
    stage: createBridgeStage(loadCatalog())
  });
}

function printResult(result: RidgeCommandResult, asJson: boolean): void {
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
  output.write(`${formatObservation(result.observation)}\n`);
}

async function runScript(script: string, asJson: boolean): Promise<number> {
  const session = createSession();
  const results = session.execScript(script);
  for (const result of results) {
    printResult(result, asJson);
    if (!result.ok && result.observation.mode === 'explore') {
      // Keep going for soft failures like blocked movement inside a script.
    }
  }
  if (results.length === 0) {
    printResult(session.exec('look'), asJson);
  }
  return 0;
}

async function runRepl(asJson: boolean): Promise<number> {
  const session = createSession();
  const rl = readline.createInterface({ input, output });

  output.write('Ridge Console — Bridge Area stick prototype\n');
  output.write('Type help. Ctrl+C or quit to exit.\n\n');
  output.write(`${session.format()}\n`);

  while (true) {
    const answer = await rl.question('\nridge> ');
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
  const scriptIndex = args.indexOf('--script');
  const script = scriptIndex >= 0 ? args[scriptIndex + 1] : undefined;

  if (script) {
    return runScript(script, asJson);
  }

  if (!input.isTTY) {
    // Non-interactive stdin: treat whole stdin as a script.
    const chunks: Buffer[] = [];
    for await (const chunk of input) {
      chunks.push(Buffer.from(chunk));
    }
    const scriptFromStdin = Buffer.concat(chunks).toString('utf8').trim();
    if (!scriptFromStdin) {
      output.write('No commands on stdin. Example: echo "look; help" | pnpm ridge:console\n');
      return 1;
    }
    return runScript(scriptFromStdin, asJson);
  }

  return runRepl(asJson);
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
