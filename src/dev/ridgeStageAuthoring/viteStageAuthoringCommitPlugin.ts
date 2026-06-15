import type { Plugin } from 'vite';
import { join } from 'node:path';
import type { BridgeStageCompositionSource } from '../../game/scenes/ridge/bridge/stageComposition';
import {
  BRIDGE_STAGE_COMPOSITION_SOURCE_PATH,
  patchBridgeStageCompositionSourceFile
} from './patchBridgeStageCompositionSource';
import { RIDGE_STAGE_AUTHORING_COMMIT_PATH } from './constants';

export { RIDGE_STAGE_AUTHORING_COMMIT_PATH };

export function ridgeStageAuthoringCommitPlugin(): Plugin {
  return {
    name: 'ridge-stage-authoring-commit',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== RIDGE_STAGE_AUTHORING_COMMIT_PATH) {
          next();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        try {
          const body = await readRequestBody(req);
          const parsed = JSON.parse(body) as { source?: BridgeStageCompositionSource };
          if (!parsed.source || parsed.source.id !== 'bridge') {
            res.statusCode = 400;
            res.end('Expected Bridge stage composition draft payload');
            return;
          }

          const filePath = join(process.cwd(), BRIDGE_STAGE_COMPOSITION_SOURCE_PATH);
          patchBridgeStageCompositionSourceFile(filePath, parsed.source);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            ok: false,
            message: error instanceof Error ? error.message : 'Stage authoring commit failed'
          }));
        }
      });
    }
  };
}

function readRequestBody(req: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
