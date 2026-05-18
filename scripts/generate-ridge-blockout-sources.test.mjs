import { describe, expect, it } from 'vitest';
import {
  assertNoStaleGeneratedFiles,
  formatStaleGeneratedFilesMessage
} from './generate-ridge-blockout-sources.mjs';

describe('generate-ridge-blockout-sources script', () => {
  it('formats stale generated source failures with actionable file paths', () => {
    expect(formatStaleGeneratedFilesMessage([
      'src/game/scenes/ridge/blockout/sources/folded-desk-ridge.generated.ts'
    ])).toBe([
      'Ridge source generated files are stale:',
      '- src/game/scenes/ridge/blockout/sources/folded-desk-ridge.generated.ts'
    ].join('\n'));
  });

  it('throws for the check-mode stale generation path', () => {
    expect(() => assertNoStaleGeneratedFiles([
      'src/game/scenes/ridge/blockout/sources/folded-desk-ridge.generated.ts'
    ])).toThrow('Ridge source generated files are stale:');
  });
});
