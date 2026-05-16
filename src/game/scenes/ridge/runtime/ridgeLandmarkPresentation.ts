import type * as Phaser from 'phaser';
import {
  type RidgeAnchorFact,
  type RidgeBlockoutAnchorSelector,
  type RidgeBlockoutFacts
} from '../blockout';
import {
  createCickaPerch,
  type CickaPerch
} from '../cicka/CickaPerch';
import { addCickaHomeMutationPresentation } from '../cicka/homeMutationPresentation';
import {
  hasCickaHomeMutationAdd,
  type CickaHomeMutation
} from '../cicka/homeMutations';
import {
  hasRidgeWorldMemory,
  type RidgeWorldMemory
} from '../worldMemory';
import { requireRidgeBlockoutFactAnchor } from './ridgePresentationFacts';

const CICKA_PERCH_OFFSET_Y = -10;
const RELAY_SPIRE_OFFSET = { x: 230, y: -180 } as const;

export const RIDGE_LANDMARK_ANCHOR_SELECTORS = {
  cicka: {
    roomId: 'cicka_home',
    symbol: 'C',
    kind: 'npc',
    attrId: 'cicka'
  },
  outskirtsArtifact: {
    roomId: 'outskirts',
    symbol: 'A',
    attrId: 'city_edge_memory'
  },
  stampede: {
    roomId: 'stampede_blanket',
    symbol: '*',
    kind: 'minigame',
    attrId: 'stampede_sketch'
  },
  telegraph: {
    roomId: 'telegraph_terrace',
    symbol: '*',
    kind: 'minigame',
    attrId: 'telegraph_future'
  },
  guide: {
    roomId: 'guide_overlook',
    symbol: 'N',
    kind: 'npc',
    attrId: 'ridge_guide'
  },
  relay: {
    roomId: 'relay_gate',
    symbol: '?',
    kind: 'gate',
    attrId: 'relay_proof_slots'
  },
  domino: {
    roomId: 'domino_desk',
    symbol: 'A',
    attrId: 'domino_project_scrap'
  },
  highLedge: {
    roomId: 'high_ledge',
    symbol: '?',
    kind: 'gate',
    attrId: 'movement_reward_tease'
  }
} as const satisfies Record<string, RidgeBlockoutAnchorSelector>;

export type RidgeLandmarkAnchorId = keyof typeof RIDGE_LANDMARK_ANCHOR_SELECTORS;

export type RidgeLandmarkAnchors = Record<RidgeLandmarkAnchorId, RidgeAnchorFact>;

export interface RidgeLandmarkPresentationCopy {
  title: string;
  stampedeFirstClearLabel: string;
  cickaWalkByLine: string;
}

export interface RidgeLandmarkPresentationOptions {
  scene: Phaser.Scene;
  facts: RidgeBlockoutFacts;
  copy: RidgeLandmarkPresentationCopy;
  worldMemories: readonly RidgeWorldMemory[];
  cickaHomeMutations: readonly CickaHomeMutation[];
}

export interface RidgeLandmarkPresentation {
  cickaPerch: CickaPerch;
}

export function createRidgeLandmarkPresentation(
  options: RidgeLandmarkPresentationOptions
): RidgeLandmarkPresentation {
  const { scene, facts, copy, worldMemories, cickaHomeMutations } = options;
  const anchors = resolveRidgeLandmarkAnchors(facts);
  const cickaLandmark = {
    x: anchors.cicka.x,
    y: anchors.cicka.y + CICKA_PERCH_OFFSET_Y
  };

  const cickaPerch = createCickaPerch({
    scene,
    landmark: cickaLandmark,
    hasStampedeNoteMutation: hasCickaHomeMutationAdd(cickaHomeMutations, 'stampede_note'),
    walkByLine: copy.cickaWalkByLine
  });
  addCickaHomeMutationPresentation({
    scene,
    landmark: cickaLandmark,
    mutations: cickaHomeMutations
  });

  addOutskirtsArtifactSlot(scene, anchors.outskirtsArtifact.x, anchors.outskirtsArtifact.y);
  addStampedeBlanket(
    scene,
    anchors.stampede.x,
    anchors.stampede.y,
    copy.stampedeFirstClearLabel,
    worldMemories.filter((memory) => memory.landmarkKind === 'stampede-blanket')
  );
  addTelegraphBag(scene, anchors.telegraph.x, anchors.telegraph.y);
  addRidgeGuide(scene, anchors.guide.x, anchors.guide.y);
  addRelayGate(scene, anchors.relay.x, anchors.relay.y);
  addRelaySpire(
    scene,
    anchors.relay.x + RELAY_SPIRE_OFFSET.x,
    anchors.relay.y + RELAY_SPIRE_OFFSET.y
  );
  addDominoDesk(scene, anchors.domino.x, anchors.domino.y);
  addHighLedgeTeaser(scene, anchors.highLedge.x, anchors.highLedge.y);
  addPlaceholderCopy(scene, facts.spawn, copy.title);

  return { cickaPerch };
}

export function resolveRidgeLandmarkAnchors(
  facts: RidgeBlockoutFacts
): RidgeLandmarkAnchors {
  return {
    cicka: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.cicka,
      'Cicka Home perch'
    ),
    outskirtsArtifact: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.outskirtsArtifact,
      'Outskirts artifact'
    ),
    stampede: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.stampede,
      'Stampede blanket'
    ),
    telegraph: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.telegraph,
      'Telegraph Terrace bag'
    ),
    guide: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.guide,
      'Ridge guide'
    ),
    relay: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.relay,
      'Relay Gate'
    ),
    domino: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.domino,
      'Domino Desk'
    ),
    highLedge: requireRidgeBlockoutFactAnchor(
      facts,
      RIDGE_LANDMARK_ANCHOR_SELECTORS.highLedge,
      'High Ledge teaser'
    )
  };
}

function addOutskirtsArtifactSlot(scene: Phaser.Scene, x: number, y: number): void {
  scene.add.rectangle(x - 44, y + 22, 92, 8, 0x1f1f1d, 0.2).setDepth(18);
  scene.add.rectangle(x - 18, y - 4, 58, 36, 0xf7f1df, 0.94)
    .setStrokeStyle(3, 0x1f1f1d, 0.72)
    .setAngle(-5)
    .setDepth(18);
  scene.add.rectangle(x + 34, y - 16, 34, 24, 0xf0d35f, 0.82)
    .setStrokeStyle(2, 0x1f1f1d, 0.72)
    .setAngle(7)
    .setDepth(18);
  scene.add.circle(x + 34, y - 16, 4, 0x1f1f1d, 0.76).setDepth(19);
  scene.add.circle(x + 44, y - 10, 3, 0x1f1f1d, 0.76).setDepth(19);
}

function addStampedeBlanket(
  scene: Phaser.Scene,
  x: number,
  y: number,
  stampedeFirstClearLabel: string,
  memories: readonly RidgeWorldMemory[]
): void {
  scene.add.rectangle(x, y + 22, 104, 32, 0xb85f5a, 0.9).setDepth(16);
  scene.add.rectangle(x - 26, y + 22, 18, 32, 0xf7f1df, 0.7).setDepth(17);
  scene.add.rectangle(x + 26, y + 22, 18, 32, 0xf7f1df, 0.7).setDepth(17);
  scene.add.circle(x - 22, y - 4, 11, 0x1f1f1d, 0.92).setDepth(17);
  scene.add.circle(x + 28, y + 2, 9, 0x1f1f1d, 0.75).setDepth(17);
  if (memories.length) {
    addStampedeBlanketMemories(scene, x, y + 22, stampedeFirstClearLabel, memories);
  }
}

function addStampedeBlanketMemories(
  scene: Phaser.Scene,
  x: number,
  y: number,
  stampedeFirstClearLabel: string,
  memories: readonly RidgeWorldMemory[]
): void {
  if (hasRidgeWorldMemory(memories, 'stampede-settled-swarm')) {
    [
      { x: -55, y: -36, radius: 4 },
      { x: -42, y: -49, radius: 3 },
      { x: -30, y: -39, radius: 2 },
      { x: 54, y: -30, radius: 3 },
      { x: 66, y: -43, radius: 2 }
    ].forEach((dot) => {
      scene.add.circle(x + dot.x, y + dot.y, dot.radius, 0x1f1f1d, 0.24).setDepth(18);
    });
  }
  if (hasRidgeWorldMemory(memories, 'stampede-held-sticker')) {
    scene.add.rectangle(x + 42, y - 48, 58, 26, 0xf7f1df, 1)
      .setStrokeStyle(3, 0x1f1f1d, 0.95)
      .setAngle(-8)
      .setDepth(19);
    scene.add.text(x + 20, y - 57, stampedeFirstClearLabel, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#1f1f1d'
    }).setAngle(-8).setDepth(20);
  }
  if (hasRidgeWorldMemory(memories, 'stampede-glide-pip-decal')) {
    scene.add.circle(x + 74, y - 18, 11, 0xf7f1df, 1)
      .setStrokeStyle(2, 0x1f1f1d, 0.9)
      .setDepth(19);
    scene.add.line(x + 74, y - 18, -6, 6, 6, -6, 0x1f1f1d, 0.85).setLineWidth(2).setDepth(20);
  }
}

function addTelegraphBag(scene: Phaser.Scene, x: number, y: number): void {
  scene.add.rectangle(x, y, 70, 54, 0x596f8f, 0.84).setDepth(16);
  scene.add.rectangle(x, y - 34, 48, 16, 0x1f1f1d, 0.88).setDepth(17);
  scene.add.arc(x, y - 40, 36, Math.PI, Math.PI * 2, false, 0x1f1f1d, 0.2)
    .setStrokeStyle(4, 0x1f1f1d, 0.7)
    .setDepth(17);
  scene.add.line(x + 62, y - 18, -30, -20, 30, 20, 0x1f1f1d, 0.7).setLineWidth(4).setDepth(18);
}

function addRidgeGuide(scene: Phaser.Scene, x: number, y: number): void {
  scene.add.circle(x, y - 28, 16, 0xf7f1df, 1).setStrokeStyle(3, 0x1f1f1d, 1).setDepth(18);
  scene.add.rectangle(x, y + 8, 32, 58, 0xf7f1df, 1).setStrokeStyle(3, 0x1f1f1d, 1).setDepth(18);
  scene.add.line(x - 8, y + 2, -30, -16, -52, -28, 0x1f1f1d, 1).setLineWidth(4).setDepth(19);
  scene.add.rectangle(x + 42, y - 8, 42, 28, 0xf0d35f, 0.9).setStrokeStyle(3, 0x1f1f1d, 1).setDepth(18);
  scene.add.text(x + 29, y - 17, '?', {
    fontFamily: 'monospace',
    fontSize: '22px',
    color: '#1f1f1d'
  }).setDepth(19);
}

function addRelayGate(scene: Phaser.Scene, x: number, y: number): void {
  scene.add.rectangle(x, y, 108, 128, 0xf7f1df, 0.86)
    .setStrokeStyle(5, 0x1f1f1d, 0.86)
    .setDepth(16);
  scene.add.rectangle(x, y + 6, 66, 98, 0x1f1f1d, 0.18)
    .setStrokeStyle(3, 0x1f1f1d, 0.58)
    .setDepth(17);
  scene.add.circle(x, y - 62, 16, 0xf0d35f, 0.86)
    .setStrokeStyle(3, 0x1f1f1d, 0.72)
    .setDepth(18);
}

function addRelaySpire(scene: Phaser.Scene, x: number, y: number): void {
  scene.add.triangle(x, y, 0, 180, 46, 0, 92, 180, 0x1c1a18, 0.56).setDepth(9);
  scene.add.rectangle(x + 46, y + 125, 34, 250, 0x1c1a18, 0.56).setDepth(9);
  scene.add.line(x + 46, y, -80, 35, 80, 35, 0x1c1a18, 0.34).setLineWidth(3).setDepth(9);
  scene.add.circle(x + 46, y - 39, 12, 0xf0d35f, 0.84).setDepth(10);
}

function addDominoDesk(scene: Phaser.Scene, x: number, y: number): void {
  scene.add.rectangle(x, y, 108, 50, 0xd7c78f, 0.96).setStrokeStyle(4, 0x1f1f1d, 1).setDepth(16);
  scene.add.rectangle(x + 70, y - 40, 46, 94, 0xf7f1df, 1).setStrokeStyle(4, 0x1f1f1d, 1).setDepth(16);
  scene.add.circle(x - 28, y - 16, 7, 0x1f1f1d, 1).setDepth(17);
  scene.add.circle(x, y - 16, 7, 0x1f1f1d, 1).setDepth(17);
  scene.add.circle(x + 28, y - 16, 7, 0x1f1f1d, 1).setDepth(17);
}

function addHighLedgeTeaser(scene: Phaser.Scene, x: number, y: number): void {
  scene.add.rectangle(x, y, 142, 18, 0xf7f1df, 0.92)
    .setStrokeStyle(3, 0x1f1f1d, 0.72)
    .setDepth(16);
  scene.add.rectangle(x - 42, y - 18, 48, 26, 0xf0d35f, 0.76)
    .setStrokeStyle(2, 0x1f1f1d, 0.62)
    .setAngle(-7)
    .setDepth(17);
  scene.add.circle(x + 44, y - 32, 6, 0x1f1f1d, 0.68).setDepth(17);
  scene.add.circle(x + 60, y - 37, 4, 0x1f1f1d, 0.58).setDepth(17);
}

function addPlaceholderCopy(
  scene: Phaser.Scene,
  spawn: RidgeAnchorFact,
  title: string
): void {
  scene.add.text(spawn.x, spawn.y - 260, title, {
    fontFamily: 'monospace',
    fontSize: '34px',
    color: '#1f1f1d'
  }).setOrigin(0.5).setDepth(60);
}
