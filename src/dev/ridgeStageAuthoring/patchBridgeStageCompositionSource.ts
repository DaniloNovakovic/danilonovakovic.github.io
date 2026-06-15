import { readFileSync, writeFileSync } from 'node:fs';
import type { BridgeStageCompositionSource } from '../../game/scenes/ridge/bridge/stageComposition';
import {
  serializeBridgeStageAuthoringSections,
  stageAuthoringSyncMarker,
  STAGE_AUTHORING_SYNC_SECTIONS,
  type StageAuthoringSyncSection
} from '../../game/scenes/ridge/bridge/stageAuthoring';

export const BRIDGE_STAGE_COMPOSITION_SOURCE_PATH =
  'src/game/scenes/ridge/bridge/stageComposition.ts';

function replaceStageAuthoringSyncSection(
  content: string,
  sectionId: StageAuthoringSyncSection,
  replacement: string
): string {
  const start = stageAuthoringSyncMarker(sectionId, false);
  const end = stageAuthoringSyncMarker(sectionId, true);
  const pattern = new RegExp(
    `^(\\s*)${escapeRegExp(start)}[\\s\\S]*?^(\\s*)${escapeRegExp(end)}`,
    'm'
  );
  const match = content.match(pattern);
  if (!match) {
    throw new Error(`Missing stage authoring sync markers for section: ${sectionId}`);
  }

  const startIndent = match[1] ?? '';
  const endIndent = match[2] ?? startIndent;
  return content.replace(
    pattern,
    `${startIndent}${start}\n${replacement}\n${endIndent}${end}`
  );
}

export function patchBridgeStageCompositionSourceFile(
  filePath: string,
  source: BridgeStageCompositionSource
): string {
  const sections = serializeBridgeStageAuthoringSections(source);
  let content = readFileSync(filePath, 'utf8');

  STAGE_AUTHORING_SYNC_SECTIONS.forEach((sectionId) => {
    content = replaceStageAuthoringSyncSection(content, sectionId, sections[sectionId]);
  });

  writeFileSync(filePath, content, 'utf8');
  return content;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
